'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  increment
} from 'firebase/firestore'

const ProductContext = createContext(undefined)

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Real-time listener for products with guaranteed loading resolution
  useEffect(() => {
    let isMounted = true;
    
    // Safety fallback: guaranteed to stop loading after 3 seconds
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn("Product loading safety fallback triggered");
        setLoading(false);
      }
    }, 3000);

    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          if (!isMounted) return;
          
          const productList = snapshot.docs.map(doc => {
            const data = doc.data();
            // Robust date handling to prevent mapping crashes
            const getIsoDate = (field) => {
              try {
                if (field?.toDate) return field.toDate().toISOString();
                if (field && typeof field === 'string') return new Date(field).toISOString();
                return new Date().toISOString();
              } catch (e) {
                return new Date().toISOString();
              }
            };

            return {
              id: doc.id,
              ...data,
              createdAt: getIsoDate(data.createdAt),
              updatedAt: getIsoDate(data.updatedAt || data.createdAt)
            };
          });
          
          setProducts(productList);
        } catch (err) {
          console.error("Error processing products in snapshot:", err);
        } finally {
          if (isMounted) {
            clearTimeout(safetyTimer);
            setLoading(false);
          }
        }
      },
      (error) => {
        if (!isMounted) return;
        console.error("Firestore product sync error:", error);
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const addProduct = useCallback(async (newProduct) => {
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding product to Firestore:", error);
    }
  }, [])

  const updateProduct = useCallback(async (updatedProduct) => {
    try {
      const productRef = doc(db, "products", updatedProduct.id);
      const { id, ...data } = updatedProduct;
      await updateDoc(productRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating product in Firestore:", error);
    }
  }, [])

  const deleteProduct = useCallback(async (productId) => {
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (error) {
      console.error("Error deleting product from Firestore:", error);
    }
  }, [])

  const decreaseStock = useCallback(async (productId, quantity, sellerId, productName, variantId = null, weightMultiplier = 1) => {
    try {
      const productRef = doc(db, "products", productId);
      const snap = await getDoc(productRef);
      
      if (!snap.exists()) return;
      const productData = snap.data();
      let updatedData = {
        updatedAt: serverTimestamp()
      };

      const deductionAmount = parseFloat(quantity) * parseFloat(weightMultiplier);

      if (variantId && productData.variants) {
        const updatedVariants = productData.variants.map(v => {
          if (v.id === variantId) {
            // Subtract from variant stock too if it exists
            const newStock = Math.max(0, parseFloat(v.stock || 0) - deductionAmount);
            return { ...v, stock: newStock };
          }
          return v;
        });
        
        updatedData.variants = updatedVariants;
        // Subtract from Global Pool
        const newGlobalStock = Math.max(0, parseFloat(productData.stockQty || productData.stock || 0) - deductionAmount);
        updatedData.stock = newGlobalStock;
        updatedData.stockQty = newGlobalStock;
        updatedData.status = newGlobalStock > 0 ? 'active' : 'out_of_stock';
      } else {
        const newStock = Math.max(0, parseFloat(productData.stockQty || productData.stock || 0) - deductionAmount);
        updatedData.stock = newStock;
        updatedData.stockQty = newStock;
        updatedData.status = newStock > 0 ? 'active' : 'out_of_stock';
      }

      await updateDoc(productRef, updatedData);

      // Threshold check for notifications
      const finalStock = updatedData.stock;
      if (finalStock <= 10) {
        await addDoc(collection(db, "notifications"), {
          type: 'low_stock',
          productId,
          productName: productName || productData.name,
          sellerId,
          message: `Low stock alert! Only ${finalStock} units left for ${productName || productData.name}.`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error decreasing stock:", error);
    }
  }, [])

  const updateProductRating = useCallback(async (productId, newRating) => {
    try {
      const productRef = doc(db, 'products', productId)
      const productSnap = await getDoc(productRef)
      
      if (productSnap.exists()) {
        const data = productSnap.data()
        const currentRating = data.rating || 0
        const currentReviewCount = data.reviewCount || 0
        
        const newReviewCount = currentReviewCount + 1
        const newAverageRating = Number(((currentRating * currentReviewCount) + newRating) / newReviewCount).toFixed(1)
        
        await updateDoc(productRef, {
          rating: parseFloat(newAverageRating),
          reviewCount: newReviewCount,
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error updating product rating:', error)
      throw error
    }
  }, [])

  const getProductById = useCallback((id) => {
    return products.find((p) => p.id === id)
  }, [products])

  const value = useMemo(() => ({
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    decreaseStock,
    updateProductRating,
  }), [products, loading, addProduct, updateProduct, deleteProduct, getProductById, decreaseStock, updateProductRating])

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
