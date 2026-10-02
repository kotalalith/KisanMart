'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from './firebase'
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  increment
} from 'firebase/firestore'

export const DEFAULT_SAMPLE_ADDRESS = {
  id: 'addr-default-1',
  label: 'Home',
  fullName: 'Aniket Sharma',
  phone: '+91 98234 56789',
  addressLine1: 'Flat 402, Green Meadows',
  addressLine2: 'FC Road, Shivajinagar',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  isDefault: true
};

const UserContext = createContext(undefined)

export function UserProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null)
  const [addresses, setAddresses] = useState([DEFAULT_SAMPLE_ADDRESS])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)

  // Dynamic User ID for testing
  const [userId, setUserId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agro_test_uid') || 'buyer-123'
    }
    return 'buyer-123'
  })

  // Function to determine which collection a user belongs to
  const getCollectionName = useCallback((uid) => {
    if (uid.includes('delivery') || uid.startsWith('dl-')) return 'delivery_partners';
    if (uid.includes('seller') || uid.startsWith('sel-')) return 'sellers';
    return 'users'; // Default for buyers/general users
  }, []);

  // Function to switch identity for testing
  const switchIdentity = useCallback((newUid) => {
    setUserId(newUid)
    if (typeof window !== 'undefined') {
      localStorage.setItem('agro_test_uid', newUid)
    }
    window.location.reload()
  }, [])

  // Real-time listener for user profile
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    const collectionName = getCollectionName(userId);
    const userRef = doc(db, collectionName, userId);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      clearTimeout(timer);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        let needsUpdate = false;
        const updates = {};
        
        if (collectionName === 'users') {
          if (data.walletBalance === undefined) {
            updates.walletBalance = 0;
            needsUpdate = true;
          }
          if (data.firstOrderDiscountEligible === undefined) {
            updates.firstOrderDiscountEligible = true;
            needsUpdate = true;
          }
          if (!data.referralCode) {
            const userNamePart = (data.name || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4) || 'USER';
            const randomPart = Math.floor(1000 + Math.random() * 9000);
            updates.referralCode = `KISA-${userNamePart}${randomPart}`;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          updateDoc(userRef, updates).catch(err => console.error("Error setting default referral info:", err));
        }

        setUserProfile({
          id: snapshot.id,
          walletBalance: 0,
          firstOrderDiscountEligible: true,
          ...data,
          ...updates
        });
        setAddresses((data.addresses && data.addresses.length > 0) ? data.addresses : [DEFAULT_SAMPLE_ADDRESS]);
        setWishlist(data.wishlist || []);
      } else {
        // Auto-initialize for test identities starting with 'dl-', 'sel-', or 'buyer-'
        const isDelivery = collectionName === 'delivery_partners';
        const isSeller = collectionName === 'sellers';
        const isUser = collectionName === 'users';
        
        if (isDelivery || isSeller || userId.startsWith('buyer-')) {
          const randomPart = Math.floor(1000 + Math.random() * 9000);
          const initialData = {
            name: isSeller ? 'Farmer Ram' : isDelivery ? 'New Partner' : 'Valued Buyer',
            email: `${userId.replace('dl-', '')}@agrobridge.com`,
            phone: '9999999999',
            addresses: [DEFAULT_SAMPLE_ADDRESS],
            wishlist: [],
            role: isSeller ? 'seller' : isDelivery ? 'delivery' : 'buyer',
            status: 'active',
            kycStatus: isDelivery ? 'pending' : 'na',
            deliveryId: isDelivery ? `AGRO-DL-${Math.floor(1000 + Math.random() * 9000)}` : null,
            createdAt: new Date().toISOString()
          };

          if (isUser) {
            initialData.walletBalance = 0;
            initialData.firstOrderDiscountEligible = true;
            initialData.referralCode = `KISA-${(userId.startsWith('buyer-') ? 'BUYER' : 'USER')}${randomPart}`;
          }

          await setDoc(userRef, initialData);
          setUserProfile({ id: userId, ...initialData });
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(timer);
      console.error("Profile sync error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [userId, getCollectionName]);


  const updateProfile = useCallback(async (updates) => {
    if (!userId) return;
    try {
      const collectionName = getCollectionName(userId);
      const userRef = doc(db, collectionName, userId);
      
      // Check if document exists before updating
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create if doesn't exist
        await setDoc(userRef, {
          ...updates,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }, [userId, getCollectionName]);

  const addAddress = useCallback(async (newAddress) => {
    if (!userId) return;
    const cleanAddress = {
      id: `addr-${Date.now()}`,
      label: newAddress.label || 'Home',
      fullName: newAddress.fullName || userProfile?.name || 'Customer',
      phone: newAddress.phone || userProfile?.phone || '',
      addressLine1: newAddress.street || newAddress.addressLine1 || '',
      addressLine2: newAddress.addressLine2 || '',
      city: newAddress.city || '',
      state: newAddress.state || '',
      pincode: newAddress.zip || newAddress.pincode || '',
      isDefault: newAddress.isDefault || false
    };

    let updatedAddresses = [...addresses];
    if (cleanAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }
    if (updatedAddresses.length === 0) {
      cleanAddress.isDefault = true;
    }
    updatedAddresses.push(cleanAddress);
    await updateProfile({ addresses: updatedAddresses });
  }, [userId, addresses, userProfile, updateProfile]);

  const deleteAddress = useCallback(async (addressId) => {
    if (!userId) return;
    const updatedAddresses = addresses.filter(a => a.id !== addressId);
    if (addresses.find(a => a.id === addressId)?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }
    await updateProfile({ addresses: updatedAddresses });
  }, [userId, addresses, updateProfile]);

  const setAsDefaultAddress = useCallback(async (addressId) => {
    if (!userId) return;
    const updatedAddresses = addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId
    }));
    await updateProfile({ addresses: updatedAddresses });
  }, [userId, addresses, updateProfile]);

  const applyReferralCode = useCallback(async (code) => {
    if (!userId || !userProfile) throw new Error('User not logged in');
    if (!code) throw new Error('Referral code is required');
    
    const cleanCode = code.trim().toUpperCase();
    
    // 1. Validation: Prevent self-referral
    if (userProfile.referralCode === cleanCode) {
      throw new Error('You cannot refer yourself');
    }
    
    // Check if user has already been referred
    if (userProfile.referredBy) {
      throw new Error('You have already applied a referral code');
    }

    // Fetch dynamic program settings
    const settingsSnap = await getDoc(doc(db, 'admin_settings', 'referral'));
    let friendReward = 50;
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data();
      if (settings.enabled === false) throw new Error('Referral program is currently paused');
      friendReward = Number(settings.friendReward || 50);
    }
    
    // 2. Query Firestore users for the referral code
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', cleanCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid referral code');
    }
    
    const referrerDoc = querySnapshot.docs[0];
    const referrerData = referrerDoc.data();
    const referrerId = referrerDoc.id;
    
    // 3. Link referee in user's profile and award signup bonus
    await updateProfile({
      referredBy: referrerId,
      referredByCode: cleanCode,
      walletBalance: increment(friendReward)
    });

    // Write wallet transaction log for signup bonus
    const txRef = doc(collection(db, "wallet_transactions"))
    await setDoc(txRef, {
      id: txRef.id,
      userId: userId,
      type: 'credit',
      amount: friendReward,
      note: `Welcome Bonus (Referred by ${referrerData.name || 'Friend'})`,
      createdAt: new Date().toISOString()
    })
    
    // 4. Create document in 'referrals' collection
    const referralsRef = collection(db, 'referrals');
    const referralId = `ref-${Date.now()}`;
    await setDoc(doc(db, 'referrals', referralId), {
      id: referralId,
      referrerId: referrerId,
      referrerName: referrerData.name || 'Referrer',
      refereeId: userId,
      refereeName: userProfile.name || 'Friend',
      refereeEmail: userProfile.email || '',
      status: 'Registered', // Statuses: Registered, Ordered, Delivered, Credited
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return referrerData;
  }, [userId, userProfile, updateProfile]);

  return (
    <UserContext.Provider value={{ 
      userId, 
      userProfile, 
      addresses, 
      wishlist, 
      loading, 
      updateProfile, 
      switchIdentity,
      addAddress,
      deleteAddress,
      setAsDefaultAddress,
      applyReferralCode
    }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
