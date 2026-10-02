'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  query, 
  orderBy, 
  getDoc 
} from 'firebase/firestore'
import { useNotifications } from './notification-context'

export const DEFAULT_SAMPLE_DELIVERY_PARTNER = {
  id: 'dl-vikram',
  name: 'Vikram Singh',
  email: 'vikram.delivery@agrobridge.com',
  phone: '+91 98765 43210',
  role: 'delivery',
  collection: 'delivery_partners',
  deliveryId: 'AGRO-DL-7721',
  vehicleType: 'Mini Truck (TATA Ace)',
  vehicleNumber: 'MH-12-AB-9876',
  kycStatus: 'approved',
  status: 'active',
  walletBalance: 1250,
  wallet: {
    isActivated: true,
    balance: 1250,
    depositPaid: 500,
    totalEarned: 4800,
    depositPending: false,
    withdrawalPending: false
  },
  createdAt: new Date().toISOString()
};

const AdminUsersContext = createContext(undefined)

export function AdminUsersProvider({ children }) {
  const [users, setUsers] = useState([DEFAULT_SAMPLE_DELIVERY_PARTNER])
  const [loading, setLoading] = useState(true)
  const { sendMultiChannelNotification } = useNotifications()

  useEffect(() => {
    // Listen to multiple collections and combine them
    const collectionsToListen = ['users', 'delivery_partners', 'sellers'];
    const unsubscribes = [];
    const allData = {
      users: [],
      delivery_partners: [],
      sellers: []
    };

    collectionsToListen.forEach(collName => {
      const q = query(collection(db, collName), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        allData[collName] = snapshot.docs.map(doc => ({
          id: doc.id,
          collection: collName, // Track which collection it came from
          ...doc.data()
        }));

        // Combine all results
        const combined = [
          ...allData.users,
          ...allData.delivery_partners,
          ...allData.sellers
        ];
        
        const hasDelivery = combined.some(u => (u.role === 'delivery' || u.collection === 'delivery_partners') && u.status === 'active');
        const finalUsers = hasDelivery ? combined : [...combined, DEFAULT_SAMPLE_DELIVERY_PARTNER];
        
        setUsers(finalUsers);
        setLoading(false);
      }, (error) => {
        console.error(`Error syncing ${collName}:`, error);
        setLoading(false);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const updateKycStatus = useCallback(async (userId, status) => {
    // Optimistic local update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, kycStatus: status, updatedAt: new Date().toISOString() } : u));
    try {
      const user = users.find(u => u.id === userId);
      const collectionName = user?.collection || (userId.startsWith('dl-') ? 'delivery_partners' : userId.startsWith('sel-') ? 'sellers' : 'users');
      const userRef = doc(db, collectionName, userId);
      await setDoc(userRef, {
        kycStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Trigger KYC updates notifications
      if (status === 'approved') {
        await sendMultiChannelNotification({
          recipientId: userId,
          title: "KYC Verification Approved",
          message: "Congratulations! Your KYC documents have been reviewed and approved. You are now active on KisaNetra.",
          type: 'account',
          priority: 'Critical',
          clickAction: collectionName === 'sellers' ? '/seller' : '/delivery'
        })
      } else if (status === 'rejected') {
        await sendMultiChannelNotification({
          recipientId: userId,
          title: "KYC Verification Rejected",
          message: "Your KYC documents were rejected. Please review your profile and re-upload valid documents.",
          type: 'account',
          priority: 'Critical',
          clickAction: collectionName === 'sellers' ? '/seller/kyc' : '/delivery'
        })
      }
    } catch (error) {
      console.error("Error updating KYC:", error);
    }
  }, [users, sendMultiChannelNotification]);

  const updateUserStatus = useCallback(async (userId, status) => {
    // Optimistic local update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: status, updatedAt: new Date().toISOString() } : u));
    try {
      const user = users.find(u => u.id === userId);
      const collectionName = user?.collection || (userId.startsWith('dl-') ? 'delivery_partners' : userId.startsWith('sel-') ? 'sellers' : 'users');
      const userRef = doc(db, collectionName, userId);
      await setDoc(userRef, {
        status: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }, [users]);

  const updateDocStatus = useCallback(async (userId, field, status) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found locally");
      
      const userRef = doc(db, user.collection, userId);
      await updateDoc(userRef, {
        [`${field}Status`]: status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating doc status:", error);
      throw error;
    }
  }, [users]);

  return (
    <AdminUsersContext.Provider value={{ 
      users, 
      loading, 
      updateKycStatus, 
      updateUserStatus,
      updateDocStatus 
    }}>
      {children}
    </AdminUsersContext.Provider>
  )
}

export const useAdminUsers = () => {
  const context = useContext(AdminUsersContext)
  if (context === undefined) {
    throw new Error('useAdminUsers must be used within an AdminUsersProvider')
  }
  return context
}
