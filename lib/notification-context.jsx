'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { db, messaging } from './firebase'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { useUser } from './user-context'
import { toast } from 'sonner'

const NotificationContext = createContext(undefined)

const DEFAULT_PREFERENCES = {
  orders: true,
  payments: true,
  deliveries: true,
  promotions: true,
  inventory: true,
  account: true
}

// Configurable retention rules: mapping categories to expiration durations (in milliseconds)
const RETENTION_RULES = {
  promotions: 7 * 24 * 60 * 60 * 1000, // 7 Days
  deliveries: 30 * 24 * 60 * 60 * 1000, // 30 Days
  orders: 60 * 24 * 60 * 60 * 1000,    // 60 Days
  inventory: 14 * 24 * 60 * 60 * 1000, // 14 Days
  account: 90 * 24 * 60 * 60 * 1000,   // 90 Days
  default: 30 * 24 * 60 * 60 * 1000    // 30 Days default
}

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-order-1',
    title: 'Order Dispatched #AG-9421',
    message: 'Your order for 50kg Organic Tomatoes from Green Valley Farm is packed and out for delivery.',
    type: 'orders',
    priority: 'High',
    clickAction: '/orders',
    status: 'Active',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'notif-pay-1',
    title: 'Payment Confirmed ₹2,400',
    message: 'Your payment via UPI was successfully verified and secured in buyer escrow protection.',
    type: 'payments',
    priority: 'Medium',
    clickAction: '/orders',
    status: 'Active',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString()
  },
  {
    id: 'notif-delivery-1',
    title: 'Delivery Partner Assigned 🚚',
    message: 'Driver Ramesh (KA-05-8812) has been assigned to deliver Batch #8812 to your address.',
    type: 'deliveries',
    priority: 'Medium',
    clickAction: '/orders',
    status: 'Active',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString()
  },
  {
    id: 'notif-offer-1',
    title: 'Special Harvest Discount: 15% Off',
    message: 'Exclusive farm-gate pricing on fresh Moong Dal & Toor Dal for registered buyers.',
    type: 'promotions',
    priority: 'Low',
    clickAction: '/categories',
    status: 'Active',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString()
  },
  {
    id: 'notif-zone-1',
    title: 'Express Delivery Live in Your City',
    message: 'AgroBridge same-day farm delivery is now fully active for your delivery address.',
    type: 'account',
    priority: 'Medium',
    clickAction: '/',
    status: 'Active',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  }
]

export function NotificationProvider({ children }) {
  const { userId, userProfile } = useUser()
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [fcmToken, setFcmToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. Synchronize Notification Preferences from Firestore
  useEffect(() => {
    if (!userId) return

    const prefRef = doc(db, "notification_preferences", userId)
    const unsubscribe = onSnapshot(prefRef, (snapshot) => {
      if (snapshot.exists()) {
        setPreferences(snapshot.data().preferences || DEFAULT_PREFERENCES)
      } else {
        // Initialize with defaults if profile preferences document doesn't exist
        setDoc(prefRef, { preferences: DEFAULT_PREFERENCES, updatedAt: serverTimestamp() })
        setPreferences(DEFAULT_PREFERENCES)
      }
    })

    return () => unsubscribe()
  }, [userId])

  // 2. Real-time notifications listener for current user
  useEffect(() => {
    if (!userId) {
      setNotifications(DEFAULT_NOTIFICATIONS)
      setLoading(false)
      return
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(100)
    )

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              scheduledAt: data.scheduledAt?.toDate?.()?.toISOString() || null,
              expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
              archivedAt: data.archivedAt?.toDate?.()?.toISOString() || null
            }
          })
          setNotifications(list)
        } else {
          const cached = typeof window !== 'undefined' ? localStorage.getItem('agro_notifications') : null
          if (cached) {
            try {
              setNotifications(JSON.parse(cached))
            } catch (e) {
              setNotifications(DEFAULT_NOTIFICATIONS)
            }
          } else {
            setNotifications(DEFAULT_NOTIFICATIONS)
          }
        }
        setLoading(false)
      },
      (error) => {
        console.warn("Notifications sync fallback to defaults:", error)
        const cached = typeof window !== 'undefined' ? localStorage.getItem('agro_notifications') : null
        if (cached) {
          try {
            setNotifications(JSON.parse(cached))
          } catch (e) {
            setNotifications(DEFAULT_NOTIFICATIONS)
          }
        } else {
          setNotifications(DEFAULT_NOTIFICATIONS)
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  // 3. Centralized lifecycle sweeper to clean up expired notifications
  const sweepExpiredNotifications = useCallback(async () => {
    try {
      const now = new Date()
      // Sweep clientside notifications from Firestore (would normally run in cloud functions, but we sweep locally on user load for dev convenience)
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId || "guest"),
        where("status", "==", "Active")
      )

      // We read the query snapshot and dynamically check/update any expired items
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach(async (d) => {
          const data = d.data()
          if (data.expiresAt && data.expiresAt.toDate() <= now) {
            await updateDoc(d.ref, {
              status: 'Expired',
              updatedAt: serverTimestamp()
            })
            // Write to compliance audit logs
            await addDoc(collection(db, "notification_audit_logs"), {
              actionType: "auto_expire",
              targetId: d.id,
              userId: userId || "system",
              timestamp: serverTimestamp(),
              details: { reason: "Retention period expired", category: data.type }
            })
          }
        })
      })

      // Clean up local listeners after evaluation
      setTimeout(() => unsubscribe(), 3000)
    } catch (e) {
      console.error("Lifecycle sweeper error:", e)
    }
  }, [userId])

  // Run sweeper once user is loaded
  useEffect(() => {
    if (userId) {
      sweepExpiredNotifications()
    }
  }, [userId, sweepExpiredNotifications])

  // 4. Client FCM registration and Web Push configuration
  const registerFCM = useCallback(async () => {
    if (typeof window === "undefined" || !messaging || !userId) return
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey || apiKey.includes('Placeholder')) return

    try {
      // Check notification permissions
      let permission = Notification.permission
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }

      if (permission === 'granted') {
        // Fetch standard device token from Firebase Messaging
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '' // Standard dev key pattern
        })

        if (token) {
          setFcmToken(token)

          // Save/Register token to Firestore
          const tokenRef = doc(db, "fcm_tokens", userId)
          const snap = await getDoc(tokenRef)

          let tokensList = []
          if (snap.exists()) {
            tokensList = snap.data().tokens || []
          }

          if (!tokensList.includes(token)) {
            tokensList.push(token)
            await setDoc(tokenRef, {
              userId,
              tokens: tokensList,
              role: userProfile?.role || 'buyer',
              platform: "Web",
              updatedAt: serverTimestamp()
            })
          }
        }
      }
    } catch (err) {
      if (err.name === 'VersionError' || err.message?.includes('VersionError')) {
        // Silently ignore Firebase Messaging IndexedDB version mismatch
        console.debug("FCM IndexedDB VersionError ignored.");
      } else {
        console.warn("FCM Registration failed / permissions blocked. Fallback in-app alerts active.", err)
      }
    }
  }, [userId, userProfile])

  // Register on load if userId changes
  useEffect(() => {
    if (userId) {
      registerFCM()
    }
  }, [userId, registerFCM])

  // 5. Setup foreground push messaging event listeners
  useEffect(() => {
    if (typeof window === "undefined" || !messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[NotificationContext] Foreground push received:', payload)
      // Custom toast overlay inside active workspace
      toast.info(payload.notification?.title || "Notification Received", {
        description: payload.notification?.body || "New update on your dashboard.",
        duration: 8000,
        action: payload.data?.clickAction ? {
          label: "View",
          onClick: () => window.location.href = payload.data.clickAction
        } : undefined
      })
    })

    return () => unsubscribe()
  }, [])

  // 6. Unified Multi-Channel Notification Dispatcher
  const sendMultiChannelNotification = useCallback(async (notifData) => {
    const {
      recipientId,
      title,
      message,
      type = 'orders',
      priority = 'Low',
      clickAction = '/'
    } = notifData

    try {
      // Step A: Load recipient preferences
      const prefRef = doc(db, "notification_preferences", recipientId)
      const prefSnap = await getDoc(prefRef)
      const recipientPrefs = prefSnap.exists() ? prefSnap.data().preferences : DEFAULT_PREFERENCES

      // Cancel if user has opted out of this specific notification category
      if (!recipientPrefs[type]) {
        console.log(`User ${recipientId} opted out of ${type} notifications. Skipping dispatch.`)
        return
      }

      // Step B: Calculate retention lifecycle
      const now = new Date()
      const retentionTime = RETENTION_RULES[type] || RETENTION_RULES.default
      const expiresAt = new Date(now.getTime() + retentionTime)

      // Step C: Write notification to database feed
      const docRef = await addDoc(collection(db, "notifications"), {
        userId: recipientId,
        title,
        message,
        type,
        priority,
        clickAction,
        status: 'Active',
        sentAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
        archivedAt: null,
        opened: false,
        read: false,
        deliveredAt: null,
        openedAt: null,
        clickedAt: null,
        dismissedAt: null
      })

      // Step D: Unified delivery tracking registration
      await setDoc(doc(db, "notification_analytics", docRef.id), {
        notificationId: docRef.id,
        status: 'Sent',
        retryCount: 0,
        failureReason: null,
        updatedAt: serverTimestamp()
      })

      // Step E: Trigger Push alert if priority matches criteria
      if (priority === 'High' || priority === 'Critical') {
        // Perform FCM REST Push dispatcher
        await fetch('/api/notify-fcm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId: docRef.id,
            recipientId,
            title,
            body: message,
            clickAction,
            priority
          })
        })
      }

      // Future-Ready integrations placeholder hooks
      // if (recipientProfile.phone && type === 'orders') sendSMS(recipientProfile.phone, message);
      // if (recipientProfile.email) sendEmail(recipientProfile.email, title, message);

    } catch (e) {
      console.error("Error dispatching multi-channel notification:", e)
    }
  }, [])

  // 7. Operations management (Optimistic updates for instant UI response)
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true, opened: true, status: 'Opened' } : n)
      if (typeof window !== 'undefined') localStorage.setItem('agro_notifications', JSON.stringify(updated))
      return updated
    })
    try {
      const ref = doc(db, "notifications", id)
      await updateDoc(ref, {
        read: true,
        opened: true,
        status: 'Opened',
        openedAt: serverTimestamp()
      })

      const analyticsRef = doc(db, "notification_analytics", id)
      const snap = await getDoc(analyticsRef)
      if (snap.exists()) {
        await updateDoc(analyticsRef, { status: 'Opened', updatedAt: serverTimestamp() })
      }
    } catch (e) {
      // Local optimistic state is already set
    }
  }, [])

  const trackNotificationClick = useCallback(async (id) => {
    try {
      const ref = doc(db, "notifications", id)
      await updateDoc(ref, {
        clickedAt: serverTimestamp(),
        status: 'Clicked'
      })

      const analyticsRef = doc(db, "notification_analytics", id)
      const snap = await getDoc(analyticsRef)
      if (snap.exists()) {
        await updateDoc(analyticsRef, { status: 'Clicked', updatedAt: serverTimestamp() })
      }
    } catch (e) {}
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true, opened: true, status: 'Opened' }))
      if (typeof window !== 'undefined') localStorage.setItem('agro_notifications', JSON.stringify(updated))
      return updated
    })
    try {
      const unread = notifications.filter(n => !n.read)
      for (const notif of unread) {
        await updateDoc(doc(db, "notifications", notif.id), {
          read: true,
          opened: true,
          status: 'Opened',
          openedAt: serverTimestamp()
        })
      }
    } catch (e) {}
  }, [notifications])

  const archiveNotification = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, status: 'Archived', archivedAt: new Date().toISOString() } : n)
      if (typeof window !== 'undefined') localStorage.setItem('agro_notifications', JSON.stringify(updated))
      return updated
    })
    try {
      const ref = doc(db, "notifications", id)
      await updateDoc(ref, {
        status: 'Archived',
        archivedAt: serverTimestamp()
      })
    } catch (e) {}
  }, [])

  const restoreNotification = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, status: 'Active', archivedAt: null } : n)
      if (typeof window !== 'undefined') localStorage.setItem('agro_notifications', JSON.stringify(updated))
      return updated
    })
    try {
      const ref = doc(db, "notifications", id)
      await updateDoc(ref, {
        status: 'Active',
        archivedAt: null
      })
    } catch (e) {}
  }, [])

  const deleteNotification = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id)
      if (typeof window !== 'undefined') localStorage.setItem('agro_notifications', JSON.stringify(updated))
      return updated
    })
    try {
      const ref = doc(db, "notifications", id)
      await updateDoc(ref, {
        status: 'Deleted',
        dismissedAt: serverTimestamp()
      })
    } catch (e) {}
  }, [])

  const updatePreferences = useCallback(async (newPrefs) => {
    if (!userId) return
    try {
      const prefRef = doc(db, "notification_preferences", userId)
      await setDoc(prefRef, {
        preferences: newPrefs,
        updatedAt: serverTimestamp()
      })
      setPreferences(newPrefs)

      await addDoc(collection(db, "notification_audit_logs"), {
        actionType: "preference_change",
        targetId: userId,
        userId: userId,
        timestamp: serverTimestamp(),
        details: { newPrefs }
      })
    } catch (e) {
      console.error("Error updating preferences:", e)
    }
  }, [userId])

  const value = useMemo(() => ({
    notifications,
    preferences,
    fcmToken,
    loading,
    sendMultiChannelNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    restoreNotification,
    deleteNotification,
    trackNotificationClick,
    updatePreferences,
    registerFCM
  }), [
    notifications,
    preferences,
    fcmToken,
    loading,
    sendMultiChannelNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    restoreNotification,
    deleteNotification,
    trackNotificationClick,
    updatePreferences,
    registerFCM
  ])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
