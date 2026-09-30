import { db } from './firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, writeBatch } from 'firebase/firestore'

/**
 * Logs a payment-related action to the /payment_audits collection
 * @param {string} paymentId 
 * @param {string} orderId 
 * @param {string} action - 'creation' | 'utr_submission' | 'approval' | 'rejection' | 'expiration' | 'status_change'
 * @param {string} userId - ID of buyer or administrator performing the action
 * @param {string} remarks 
 */
export async function logPaymentAction(paymentId, orderId, action, userId, remarks = "") {
  try {
    await addDoc(collection(db, "payment_audits"), {
      auditId: doc(collection(db, "payment_audits")).id,
      paymentId: paymentId || "",
      orderId: orderId || "",
      action,
      userId: userId || "system",
      remarks,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error("Failed to write payment audit log", error)
  }
}

/**
 * Sweeps the database to find payments in 'Pending Payment' or 'Pending Verification' 
 * state that are older than 24 hours, marks them as 'Expired', and cancels their associated orders.
 */
export async function sweepExpiredPayments() {
  try {
    const now = new Date()
    const thresholdTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
    
    // Query payments that are pending and might be expired
    const paymentsRef = collection(db, "payments")
    const q = query(
      paymentsRef, 
      where("paymentStatus", "in", ["Pending Payment", "Pending Verification"])
    )
    
    const querySnapshot = await getDocs(q)
    const batch = writeBatch(db)
    let expiredCount = 0

    for (const paymentDoc of querySnapshot.docs) {
      const data = paymentDoc.data()
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      
      if (createdAt < thresholdTime) {
        // Mark payment as Expired
        batch.update(doc(db, "payments", paymentDoc.id), {
          paymentStatus: "Expired",
          remarks: "Expired automatically after 24-hour verification window.",
          verifiedAt: serverTimestamp(),
          verifiedBy: "system"
        })

        // Cancel the corresponding order
        if (data.orderId) {
          batch.update(doc(db, "orders", data.orderId), {
            paymentStatus: "Expired",
            orderStatus: "cancelled",
            updatedAt: serverTimestamp()
          })
        }

        // Log the audit action
        await logPaymentAction(
          paymentDoc.id,
          data.orderId,
          "expiration",
          "system",
          "Payment expired automatically. Associated order cancelled."
        )

        expiredCount++
      }
    }

    if (expiredCount > 0) {
      await batch.commit()
      console.log(`Successfully expired ${expiredCount} unverified payments.`)
    }
    return expiredCount
  } catch (error) {
    console.error("Failed to sweep and expire payments", error)
    return 0
  }
}
