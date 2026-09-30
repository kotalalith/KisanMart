import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

/**
 * Get all buyers from Firestore for admin
 */
export async function getAllBuyersAdmin() {
  try {
    const q = query(collection(db, "buyers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all buyers (admin):", error);
    throw error;
  }
}

/**
 * Get all sellers from Firestore for admin
 */
export async function getAllSellersAdmin() {
  try {
    const q = query(collection(db, "sellers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all sellers (admin):", error);
    throw error;
  }
}

/**
 * Get all products from Firestore for admin
 */
export async function getAllProductsAdmin() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all products (admin):", error);
    throw error;
  }
}
