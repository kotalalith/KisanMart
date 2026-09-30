'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { useNotifications } from './notification-context'

const SupportContext = createContext(undefined)

export function SupportProvider({ children }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const { sendMultiChannelNotification } = useNotifications()

  // Real-time listener for support tickets
  useEffect(() => {
    const q = query(collection(db, "support_tickets"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ticketList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        setTickets(ticketList);
        setLoading(false);
      },
      (error) => {
        console.error("Support sync error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const submitTicket = useCallback(async (ticketData) => {
    try {
      const docRef = await addDoc(collection(db, "support_tickets"), {
        ...ticketData,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Notify admin superuser
      await sendMultiChannelNotification({
        recipientId: 'admin-super',
        title: "New Support Inquiry",
        message: `New support ticket opened: "${ticketData.subject || 'Inquiry'}" by user ${ticketData.userId || 'Guest'}.`,
        type: 'account',
        priority: 'High',
        clickAction: '/admin/support'
      })

      return docRef.id;
    } catch (error) {
      console.error("Error submitting ticket:", error);
      throw error;
    }
  }, [sendMultiChannelNotification])

  const updateTicketStatus = useCallback(async (ticketId, status) => {
    try {
      const ticketRef = doc(db, "support_tickets", ticketId);
      await updateDoc(ticketRef, {
        status,
        updatedAt: serverTimestamp()
      });

      // Notify original submitter of update details
      const ticket = tickets.find(t => t.id === ticketId)
      if (ticket && ticket.userId) {
        await sendMultiChannelNotification({
          recipientId: ticket.userId,
          title: "Support Ticket Updated",
          message: `Your support ticket regarding "${ticket.subject || 'Inquiry'}" is now marked as ${status.replace('_', ' ')}.`,
          type: 'account',
          priority: 'High',
          clickAction: '/support'
        })
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  }, [tickets, sendMultiChannelNotification])

  const value = useMemo(() => ({
    tickets,
    loading,
    submitTicket,
    updateTicketStatus
  }), [tickets, loading, submitTicket, updateTicketStatus])

  return (
    <SupportContext.Provider value={value}>
      {children}
    </SupportContext.Provider>
  )
}

export function useSupport() {
  const context = useContext(SupportContext)
  if (context === undefined) {
    throw new Error('useSupport must be used within a SupportProvider')
  }
  return context
}
