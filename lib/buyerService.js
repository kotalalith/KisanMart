import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

/**
 * Register a new buyer in Firestore
 * @param {Object} buyerData - { name, email, phone, location }
 */
export async function registerBuyer(buyerData) {
  try {
    const docRef = await addDoc(collection(db, "buyers"), {
      ...buyerData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error registering buyer:", error);
    throw error;
  }
}

/**
 * Get all buyers from Firestore
 */
export async function getAllBuyers() {
  try {
    const q = query(collection(db, "buyers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching buyers:", error);
    throw error;
  }
}
