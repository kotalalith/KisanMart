import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore'

/**
 * POST /api/notify
 * 
 * Lightweight endpoint for sending a single transactional notification to a specific user.
 * Supports optional template-based message resolution with dynamic placeholders.
 * 
 * Request Body:
 * {
 *   userId: string (required) – target recipient
 *   title?: string – notification title (overridden by template if templateId provided)
 *   body?: string – notification body message
 *   templateId?: string – if provided, loads template from /notification_templates
 *   data?: object – dynamic placeholder values e.g. { userName: "Lalith", orderId: "AGR-123" }
 *   clickAction?: string – deep link path
 *   priority?: 'Low' | 'Medium' | 'High' | 'Critical'
 *   type?: string – notification category (orders, payments, deliveries, etc.)
 * }
 */
export async function POST(request) {
  try {
    const { 
      userId, 
      title: rawTitle, 
      body: rawBody, 
      templateId, 
      data = {}, 
      clickAction = '/', 
      priority = 'Medium',
      type = 'orders' 
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required.' }, { status: 400 })
    }

    let resolvedTitle = rawTitle || 'Notification'
    let resolvedBody = rawBody || ''

    // Template Resolution: Load template and resolve placeholders
    if (templateId) {
      const templateRef = doc(db, "notification_templates", templateId)
      const templateSnap = await getDoc(templateRef)

      if (templateSnap.exists()) {
        const template = templateSnap.data()
        resolvedTitle = template.title || resolvedTitle
        resolvedBody = template.body || resolvedBody

        // Replace dynamic placeholders like {userName}, {orderId}, {amount} etc.
        Object.entries(data).forEach(([key, value]) => {
          const placeholder = new RegExp(`\\{${key}\\}`, 'g')
          resolvedTitle = resolvedTitle.replace(placeholder, String(value))
          resolvedBody = resolvedBody.replace(placeholder, String(value))
        })
      } else {
        console.warn(`[API /notify] Template ${templateId} not found. Using raw title/body.`)
      }
    }

    // Check user notification preferences
    const prefRef = doc(db, "notification_preferences", userId)
    const prefSnap = await getDoc(prefRef)
    if (prefSnap.exists()) {
      const prefs = prefSnap.data().preferences || {}
      if (prefs[type] === false) {
        return NextResponse.json({ 
          success: true, 
          skipped: true, 
          reason: `User opted out of '${type}' notifications.` 
        })
      }
    }

    // Calculate retention-based expiry
    const RETENTION_MS = {
      promotions: 7 * 24 * 60 * 60 * 1000,
      deliveries: 30 * 24 * 60 * 60 * 1000,
      orders: 60 * 24 * 60 * 60 * 1000,
      inventory: 14 * 24 * 60 * 60 * 1000,
      account: 90 * 24 * 60 * 60 * 1000,
      default: 30 * 24 * 60 * 60 * 1000
    }
    const expiresAt = new Date(Date.now() + (RETENTION_MS[type] || RETENTION_MS.default))

    // Write notification document to Firestore
    const notifRef = await addDoc(collection(db, "notifications"), {
      userId,
      title: resolvedTitle,
      message: resolvedBody,
      type,
      priority,
      clickAction,
      status: 'Active',
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      expiresAt,
      archivedAt: null,
      opened: false,
      read: false,
      deliveredAt: null,
      openedAt: null,
      clickedAt: null,
      dismissedAt: null
    })

    // Write analytics tracking entry
    await setDoc(doc(db, "notification_analytics", notifRef.id), {
      notificationId: notifRef.id,
      status: 'Sent',
      retryCount: 0,
      failureReason: null,
      updatedAt: serverTimestamp()
    })

    // If priority is High or Critical, trigger FCM push delivery
    if (priority === 'High' || priority === 'Critical') {
      try {
        const baseUrl = request.nextUrl?.origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/notify-fcm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId: notifRef.id,
            recipientId: userId,
            title: resolvedTitle,
            body: resolvedBody,
            clickAction,
            priority
          })
        })
      } catch (fcmErr) {
        console.warn('[API /notify] FCM push dispatch failed (non-blocking):', fcmErr.message)
      }
    }

    return NextResponse.json({
      success: true,
      notificationId: notifRef.id,
      title: resolvedTitle,
      body: resolvedBody,
      priority,
      type
    })

  } catch (err) {
    console.error('[API /notify] Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
