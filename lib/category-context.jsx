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

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Vegetables', icon: 'Carrot', description: 'Fresh farm vegetables', productCount: 0, isActive: true },
  { id: 'cat-2', name: 'Fruits', icon: 'Apple', description: 'Fresh seasonal fruits', productCount: 0, isActive: true },
  { id: 'cat-3', name: 'Grains & Cereals', icon: 'Wheat', description: 'Organic grains and flour', productCount: 0, isActive: true },
  { id: 'cat-4', name: 'Pulses & Legumes', icon: 'Bean', description: 'Protein-rich pulses and lentils', productCount: 0, isActive: true },
  { id: 'cat-5', name: 'Dairy & Eggs', icon: 'Milk', description: 'Pure dairy and farm eggs', productCount: 0, isActive: true },
  { id: 'cat-6', name: 'Spices & Herbs', icon: 'Flame', description: 'Natural aromatic spices', productCount: 0, isActive: true },
]

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)

  // Real-time listener for categories
  useEffect(() => {
    let isMounted = true;
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const categoryList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCategories(categoryList);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
        setLoading(false);
      },
      (error) => {
        if (!isMounted) return;
        console.error("Categories sync error:", error);
        setCategories(DEFAULT_CATEGORIES);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const addCategory = useCallback(async (categoryData) => {
    const tempId = 'cat-' + Date.now();
    const newCategory = {
      id: tempId,
      ...categoryData,
      productCount: 0,
      createdAt: new Date().toISOString(),
      isActive: categoryData.isActive !== false
    };
    // Optimistic update
    setCategories(prev => [...prev, newCategory]);

    try {
      const docRef = await addDoc(collection(db, "categories"), {
        ...categoryData,
        createdAt: serverTimestamp(),
        productCount: 0
      });
      setCategories(prev => prev.map(c => c.id === tempId ? { ...c, id: docRef.id } : c));
    } catch (error) {
      console.error("Error adding category:", error);
    }
  }, [])

  const updateCategory = useCallback(async (id, updates) => {
    // Optimistic update
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      const categoryRef = doc(db, "categories", id);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating category:", error);
    }
  }, [])

  const deleteCategory = useCallback(async (id) => {
    // Optimistic update
    setCategories(prev => prev.filter(c => c.id !== id));
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (error) {
      console.error("Error deleting category:", error);
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
