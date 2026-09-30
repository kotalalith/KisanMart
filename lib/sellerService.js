import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

/**
 * Register a new seller in Firestore
 * @param {Object} sellerData - { name, email, phone, location, shopName }
 */
export async function registerSeller(sellerData) {
  try {
    const docRef = await addDoc(collection(db, "sellers"), {
      ...sellerData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error registering seller:", error);
    throw error;
  }
}

/**
 * Get all sellers from Firestore
 */
export async function getAllSellers() {
  try {
    const q = query(collection(db, "sellers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching sellers:", error);
    throw error;
  }
}

/**
 * Upload a product to Firestore
 * @param {Object} productData - { name, price, unit, category, image, sellerId }
 */
export async function uploadProduct(productData) {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error uploading product:", error);
    throw error;
  }
}
