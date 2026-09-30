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
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'

const CategoryContext = createContext(undefined)

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Real-time listener for categories
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const categoryList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoryList);
        setLoading(false);
      },
      (error) => {
        console.error("Categories sync error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addCategory = useCallback(async (categoryData) => {
    try {
      await addDoc(collection(db, "categories"), {
        ...categoryData,
        createdAt: serverTimestamp(),
        productCount: 0
      });
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }, [])

  const updateCategory = useCallback(async (id, updates) => {
    try {
      const categoryRef = doc(db, "categories", id);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }, [])

  const deleteCategory = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }, [])

  const value = useMemo(() => ({
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory
  }), [categories, loading, addCategory, updateCategory, deleteCategory])

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoryContext)
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider')
  }
  return context
}
