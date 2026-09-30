import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  getDoc,
  serverTimestamp,
  increment,
  query,
  where
} from 'firebase/firestore'

// Simulated delay helper
const delay = (ms) => new Promise(res => setTimeout(res, ms))

export async function POST(request) {
  try {
    const { campaignId, notificationId, recipientId, targetAudience, title, body, clickAction, priority } = await request.json()

    // 1. Resolve Target Tokens
    let tokensToNotify = []
    const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"))
    
    // We filter documents based on segment criteria
    for (const docSnap of tokensSnapshot.docs) {
      const tokenData = docSnap.data()
      const userId = tokenData.userId
      const role = tokenData.role || 'buyer'
      const tokens = tokenData.tokens || []

      // If targeted to single recipient (transactional)
      if (recipientId && userId === recipientId) {
        tokensToNotify.push(...tokens)
        break
      }

      // If campaign broadcast
      if (campaignId) {
        let matches = false
        if (targetAudience === 'all') {
          matches = true
        } else if (targetAudience === role) {
          matches = true
        } else if (targetAudience === 'new_users') {
          // Check user creation <30 days
          const userSnap = await getDoc(doc(db, "users", userId))
          if (userSnap.exists()) {
            const created = new Date(userSnap.data().createdAt)
            const diffDays = (new Date() - created) / (1000 * 60 * 60 * 24)
            if (diffDays <= 30) matches = true
          }
        } else if (targetAudience === 'high_value') {
          // Check if total spend is > 10,000 (simulated check)
          matches = true // For demo, match all
        }

        if (matches) {
          tokensToNotify.push(...tokens)
        }
      }
    }

    if (tokensToNotify.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, warning: "No registered device tokens found for target segment." })
    }

    // 2. Execute Simulated FCM Push Deliveries (with failure retry logic)
    let deliveredCount = 0
    let failedCount = 0
    let retryLogs = []

    for (const token of tokensToNotify) {
      let attempts = 0
      let success = false
      let lastError = null

      // Retry Loop (Maximum 3 Times)
      while (attempts < 3 && !success) {
        attempts++
        try {
          // Simulate network request to FCM server
          await delay(200)

          // Simulated failure rate (e.g. 10% of attempts fail to demonstrate the retry mechanism in logs)
          const isNetworkTimeout = Math.random() < 0.10
          const isBadToken = token.includes('invalid')

          if (isBadToken) {
            throw new Error("FCM: Registration token is no longer valid (BadToken)")
          }
          if (isNetworkTimeout) {
            throw new Error("FCM: Connection timeout (GATEWAY_TIMEOUT)")
          }

          success = true
          deliveredCount++
        } catch (err) {
          lastError = err.message
          console.warn(`[API Notify-FCM] Attempt ${attempts} failed for token: ${token.substring(0, 15)}... Error: ${err.message}`)
          await delay(300) // Backoff
        }
      }

      if (!success) {
        failedCount++
        // Log delivery failure to analytics
        await addDoc(collection(db, "notification_audit_logs"), {
          actionType: "push_delivery_failure",
          targetId: campaignId || notificationId || "unknown",
          userId: recipientId || "campaign",
          timestamp: serverTimestamp(),
          details: { 
            token: token.substring(0, 20) + "...", 
            attempts, 
            reason: lastError 
          }
        })
      }
    }

    // 3. Update Campaign Statistics in Firestore
    if (campaignId) {
      const campaignRef = doc(db, "notification_campaigns", campaignId)
      await updateDoc(campaignRef, {
        status: 'Sent',
        sentCount: tokensToNotify.length,
        deliveredCount: deliveredCount,
        updatedAt: serverTimestamp()
      })
    }

    // 4. Update Single Notification Analytics if transactional
    if (notificationId) {
      const analyticsRef = doc(db, "notification_analytics", notificationId)
      const snap = await getDoc(analyticsRef)
      if (snap.exists()) {
        await updateDoc(analyticsRef, {
          status: failedCount === tokensToNotify.length ? 'Failed' : 'Delivered',
          retryCount: failedCount > 0 ? 3 : 0,
          failureReason: failedCount > 0 ? "FCM simulated timeout" : null,
          updatedAt: serverTimestamp()
        })
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: tokensToNotify.length,
      deliveredCount,
      failedCount
    })

  } catch (err) {
    console.error("FCM API Dispatch error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
