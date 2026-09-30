'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { useNotifications } from './notification-context'

const SellerContext = createContext()

export const SELLER_TYPES = {
  FARMER: {
    id: 'farmer',
    label: 'Farmer Seller',
    defaultCategories: ['cat-1', 'cat-2', 'cat-3', 'cat-4'],
  },
  ORGANIC: {
    id: 'organic',
    label: 'Organic Products Seller',
    defaultCategories: ['cat-7', 'cat-6', 'cat-9'],
  },
  PROCESSED: {
    id: 'processed',
    label: 'Processed Food Seller',
    defaultCategories: ['cat-5', 'cat-10'],
  },
  GENERAL: {
    id: 'general',
    label: 'General Marketplace Seller',
    defaultCategories: [],
  }
}

export function SellerProvider({ children }) {
  const [sellers, setSellers] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [currentSellerId, setCurrentSellerId] = useState('seller-1') 
  const { sendMultiChannelNotification } = useNotifications()

  // Real-time listener for sellers
  useEffect(() => {
    const q = query(collection(db, "sellers"), orderBy("businessName", "asc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const sellerList = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Fallback for existing mock data
            sellerType: data.sellerType || 'general',
            approvedCategories: data.approvedCategories || ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6', 'cat-7', 'cat-8'],
            pendingCategories: data.pendingCategories || [],
            restrictedCategories: data.restrictedCategories || []
          }
        });
        setSellers(sellerList);
        setLoading(false);
      },
      (error) => {
        console.error("Sellers sync error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const currentSeller = useMemo(() => {
    const found = sellers.find(s => s.id === currentSellerId)
    if (found) return found
    return sellers[0] || null
  }, [sellers, currentSellerId])

  const updateSellerKYC = useCallback(async (sellerId, updates) => {
    try {
      const sellerRef = doc(db, "sellers", sellerId);
      await updateDoc(sellerRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating seller:", error);
    }
  }, [])

  const approveKYC = useCallback(async (sellerId) => {
    await updateSellerKYC(sellerId, { kycStatus: 'verified', status: 'active' })
    await sendMultiChannelNotification({
      recipientId: sellerId,
      title: "Seller KYC Approved",
      message: "Congratulations! Your seller profile and KYC documents have been approved. You can now list and sell products.",
      type: 'account',
      priority: 'Critical',
      clickAction: '/seller'
    })
  }, [updateSellerKYC, sendMultiChannelNotification])

  const rejectKYC = useCallback(async (sellerId) => {
    await updateSellerKYC(sellerId, { kycStatus: 'rejected', status: 'suspended' })
    await sendMultiChannelNotification({
      recipientId: sellerId,
      title: "Seller KYC Rejected",
      message: "Your seller profile KYC verification was rejected. Please review and re-submit your documents.",
      type: 'account',
      priority: 'Critical',
      clickAction: '/seller/kyc'
    })
  }, [updateSellerKYC, sendMultiChannelNotification])

  const submitKYC = useCallback(async (sellerId, documents) => {
    await updateSellerKYC(sellerId, { 
      kycStatus: 'pending', 
      ...documents,
      kycProgress: 100 
    })
  }, [updateSellerKYC])

  const requestCategoryUpgrade = useCallback(async (sellerId, categoryId) => {
    const seller = sellers.find(s => s.id === sellerId)
    if (!seller) return
    if (seller.approvedCategories?.includes(categoryId) || seller.pendingCategories?.includes(categoryId)) return
    
    await updateSellerKYC(sellerId, {
      pendingCategories: [...(seller.pendingCategories || []), categoryId]
    })
    
    await sendMultiChannelNotification({
      recipientId: 'admin-1',
      title: "New Category Upgrade Request",
      message: `${seller.businessName} requested approval for a new category.`,
      type: 'account',
      priority: 'High',
      clickAction: '/admin/sellers'
    })
  }, [sellers, updateSellerKYC, sendMultiChannelNotification])

  const approveCategory = useCallback(async (sellerId, categoryId) => {
    const seller = sellers.find(s => s.id === sellerId)
    if (!seller) return
    
    await updateSellerKYC(sellerId, {
      approvedCategories: [...(seller.approvedCategories || []), categoryId],
      pendingCategories: (seller.pendingCategories || []).filter(c => c !== categoryId),
      restrictedCategories: (seller.restrictedCategories || []).filter(c => c !== categoryId)
    })
    
    await sendMultiChannelNotification({
      recipientId: sellerId,
      title: "Category Approved",
      message: "Your request to sell in a new category has been approved.",
      type: 'account',
      priority: 'High'
    })
  }, [sellers, updateSellerKYC, sendMultiChannelNotification])

  const rejectCategory = useCallback(async (sellerId, categoryId) => {
    const seller = sellers.find(s => s.id === sellerId)
    if (!seller) return
    
    await updateSellerKYC(sellerId, {
      restrictedCategories: [...(seller.restrictedCategories || []), categoryId],
      pendingCategories: (seller.pendingCategories || []).filter(c => c !== categoryId),
      approvedCategories: (seller.approvedCategories || []).filter(c => c !== categoryId)
    })
  }, [sellers, updateSellerKYC])

  const toggleSellerStatus = useCallback(async (sellerId) => {
    const seller = sellers.find(s => s.id === sellerId)
    if (!seller) return
    const newStatus = seller.status === 'active' ? 'suspended' : 'active'
    await updateSellerKYC(sellerId, { status: newStatus })
  }, [sellers, updateSellerKYC])

  const calculateSellerRating = useCallback((products, sellerId) => {
    const sellerProducts = products.filter(p => p.sellerId === sellerId)
    if (sellerProducts.length === 0) return 0
    
    const ratedProducts = sellerProducts.filter(p => (p.rating || 0) > 0)
    if (ratedProducts.length === 0) return 0

    const totalRating = ratedProducts.reduce((sum, p) => sum + (p.rating || 0), 0)
    return (totalRating / ratedProducts.length).toFixed(1)
  }, [])

  const value = useMemo(() => ({
    sellers,
    currentSeller,
    loading,
    approveKYC,
    rejectKYC,
    submitKYC,
    toggleSellerStatus,
    calculateSellerRating,
    updateSellerKYC,
    requestCategoryUpgrade,
    approveCategory,
    rejectCategory
  }), [sellers, currentSeller, loading, approveKYC, rejectKYC, submitKYC, toggleSellerStatus, calculateSellerRating, updateSellerKYC, requestCategoryUpgrade, approveCategory, rejectCategory])

  return (
    <SellerContext.Provider value={value}>
      {children}
    </SellerContext.Provider>
  )
}

export const useSellers = () => {
  const context = useContext(SellerContext)
  if (context === undefined) {
    throw new Error('useSellers must be used within a SellerProvider')
  }
  return context
}
