'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { useUser } from '@/lib/user-context'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Megaphone, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AnnouncementPopup({ role = 'buyer' }) {
  const router = useRouter()
  const { userId } = useUser()
  const [activeAnnouncement, setActiveAnnouncement] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedList, setDismissedList] = useState([])

  // Load dismissed from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('agro_dismissed_popups')
        setDismissedList(stored ? JSON.parse(stored) : [])
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Listen to active popup announcements (in-memory filtering avoids composite index requirement)
  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date()
      const list = snapshot.docs
        .map(d => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            startAt: data.startAt?.toDate?.() || null,
            endAt: data.endAt?.toDate?.() || null
          }
        })
        .filter(item => {
          // Check status & displayType
          if (item.status && item.status !== 'published') return false
          if (item.displayType && item.displayType !== 'popup') return false

          // Check audience targeting
          const matchesAudience = item.targetAudience === 'all' || item.targetAudience === role
          if (!matchesAudience) return false

          // Check scheduling
          if (item.startAt && item.startAt > now) return false
          if (item.endAt && item.endAt < now) return false

          // Check if dismissed
          if (dismissedList.includes(item.id)) return false

          return true
        })

      if (list.length > 0) {
        setActiveAnnouncement(list[0]) // Show the most recent active popup
        setIsOpen(true)
      } else {
        setActiveAnnouncement(null)
        setIsOpen(false)
      }
    }, (error) => {
      console.warn("Announcement popup Firestore sync notice:", error.message)
    })

    return () => unsubscribe()
  }, [role, dismissedList])

  // Track view impression on mount/popup display
  useEffect(() => {
    if (!activeAnnouncement || !isOpen) return

    const recordView = async () => {
      try {
        await addDoc(collection(db, "announcement_views"), {
          campaignId: activeAnnouncement.id,
          userId: userId || 'guest',
          timestamp: serverTimestamp()
        })
      } catch (e) {
        console.error("Error logging popup impression view:", e)
      }
    }

    recordView()
  }, [activeAnnouncement, isOpen, userId])

  const handleDismiss = () => {
    if (!activeAnnouncement) return
    
    const updated = [...dismissedList, activeAnnouncement.id]
    setDismissedList(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('agro_dismissed_popups', JSON.stringify(updated))
    }
    setIsOpen(false)
  }

  const handleActionClick = async () => {
    if (!activeAnnouncement) return

    // Track click event
    try {
      await addDoc(collection(db, "announcement_clicks"), {
        campaignId: activeAnnouncement.id,
        userId: userId || 'guest',
        timestamp: serverTimestamp()
      })
    } catch (e) {
      console.error("Error logging popup clickthrough:", e)
    }

    // Dismiss popup
    handleDismiss()

    if (activeAnnouncement.actionLink) {
      router.push(activeAnnouncement.actionLink)
    }
  }

  if (!activeAnnouncement) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
        
        {/* Banner Image if configured */}
        {activeAnnouncement.imageUrl ? (
          <div className="relative h-48 w-full bg-emerald-900 overflow-hidden flex items-center justify-center">
            <img 
              src={activeAnnouncement.imageUrl} 
              alt="Promo Banner" 
              className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-6 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-md tracking-wider">
                {activeAnnouncement.category}
              </span>
            </div>
          </div>
        ) : (
          <div className={cn(
            "p-6 h-36 w-full flex flex-col justify-end",
            activeAnnouncement.priority === 'Critical' 
              ? "bg-gradient-to-br from-rose-600 to-rose-700 text-white" 
              : activeAnnouncement.priority === 'High'
                ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                : "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Megaphone className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-md">
                {activeAnnouncement.category || 'Announcement'}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight">{activeAnnouncement.title}</h3>
          </div>
        )}

        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-2 text-left">
            {activeAnnouncement.imageUrl && (
              <DialogTitle className="text-xl font-black tracking-tight text-slate-800 uppercase">
                {activeAnnouncement.title}
              </DialogTitle>
            )}
            <DialogDescription className="text-xs font-bold text-slate-500 leading-relaxed break-words pt-1">
              {activeAnnouncement.content}
            </DialogDescription>
          </DialogHeader>

          {activeAnnouncement.priority === 'Critical' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-rose-800">Critical Alert notification</span>
                <p className="text-[10px] text-rose-600 leading-relaxed mt-0.5">
                  This contains important platform information and instructions. Please review immediately.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="w-full sm:flex-1 h-12 rounded-xl text-xs font-black uppercase border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            >
              Dismiss
            </Button>
            {activeAnnouncement.actionLink && (
              <Button
                onClick={handleActionClick}
                className={cn(
                  "w-full sm:flex-1 h-12 rounded-xl text-xs font-black uppercase text-white flex items-center justify-center gap-1.5 shadow-md",
                  activeAnnouncement.priority === 'Critical'
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                    : activeAnnouncement.priority === 'High'
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                )}
              >
                {activeAnnouncement.actionText || 'Read Details'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
