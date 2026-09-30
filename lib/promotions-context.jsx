'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore'

const PromotionContext = createContext(undefined)

export function PromotionProvider({ children }) {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  // Real-time listener for promotions
  useEffect(() => {
    // Fallback: If connection takes too long, stop loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const q = query(collection(db, "promotions"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      clearTimeout(timer);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset time for comparison

      const promoList = snapshot.docs.map(doc => {
        const data = doc.data();
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end day

        // Determine if it's actually active based on dates
        const isExpired = now > end;
        const isScheduled = now < start;
        
        let calculatedStatus = data.status || 'active';
        if (isExpired) calculatedStatus = 'expired';
        else if (isScheduled) calculatedStatus = 'scheduled';

        return {
          id: doc.id,
          ...data,
          status: calculatedStatus,
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          endDate: data.endDate || new Date().toISOString().split('T')[0],
        };
      });
      setPromotions(promoList);
      setLoading(false);
    }, (error) => {

      clearTimeout(timer);
      console.error("Promotions sync error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const addPromotion = useCallback(async (newPromo) => {
    console.log("Attempting to add promotion to Firestore:", newPromo);
    try {
      const docRef = await addDoc(collection(db, "promotions"), {
        ...newPromo,
        usedCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Promotion successfully added with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("CRITICAL: Error adding promotion:", error.code, error.message);
      throw error;
    }
  }, []);

  const updatePromotion = useCallback(async (promoId, updates) => {
    try {
      const promoRef = doc(db, "promotions", promoId);
      await updateDoc(promoRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating promotion:", error);
      throw error;
    }
  }, []);

  const deletePromotion = useCallback(async (promoId) => {
    try {
      await deleteDoc(doc(db, "promotions", promoId));
    } catch (error) {
      console.error("Error deleting promotion:", error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    promotions,
    loading,
    addPromotion,
    updatePromotion,
    deletePromotion
  }), [promotions, loading, addPromotion, updatePromotion, deletePromotion])

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  )
}

export function usePromotions() {
  const context = useContext(PromotionContext)
  if (context === undefined) {
    throw new Error('usePromotions must be used within a PromotionProvider')
  }
  return context
}
