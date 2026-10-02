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
import { ChevronLeft, ChevronRight, X, Megaphone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AnnouncementBanner({ role = 'buyer' }) {
  const router = useRouter()
  const { userId } = useUser()
  const [announcements, setAnnouncements] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissedList, setDismissedList] = useState([])

  // Load dismissed list from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('agro_dismissed_announcements')
        setDismissedList(stored ? JSON.parse(stored) : [])
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // 1. Listen to published banner announcements (in-memory filtering avoids composite index requirement)
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
          // Filter by status & displayType
          if (item.status && item.status !== 'published') return false
          if (item.displayType && item.displayType !== 'banner') return false

          // Filter by audience
          const matchesAudience = item.targetAudience === 'all' || item.targetAudience === role
          if (!matchesAudience) return false

          // Filter by scheduled dates
          if (item.startAt && item.startAt > now) return false
          if (item.endAt && item.endAt < now) return false

          // Filter out dismissed announcements
          if (dismissedList.includes(item.id)) return false

          return true
        })

      setAnnouncements(list)
    }, (error) => {
      console.warn("Announcement banner Firestore sync notice:", error.message)
    })

    return () => unsubscribe()
  }, [role, dismissedList])

  // 2. Track impression (View) on mount or slide transition
  useEffect(() => {
    if (announcements.length === 0 || currentIndex >= announcements.length) return

    const activeItem = announcements[currentIndex]
    
    // Write view event (simulated once per mount/slide to avoid duplicate spam)
    const recordView = async () => {
      try {
        await addDoc(collection(db, "announcement_views"), {
          campaignId: activeItem.id,
          userId: userId || 'guest',
          timestamp: serverTimestamp()
        })
      } catch (e) {
        console.error("Error logging view impression:", e)
      }
    }
    
    recordView()
  }, [announcements, currentIndex, userId])

  const handleNext = (e) => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev + 1) % announcements.length)
  }

  const handlePrev = (e) => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length)
  }

  const handleDismiss = (e, id) => {
    e.stopPropagation()
    const updated = [...dismissedList, id]
    setDismissedList(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('agro_dismissed_announcements', JSON.stringify(updated))
    }
    
    // Reset index if needed
    if (currentIndex >= announcements.length - 1) {
      setCurrentIndex(0)
    }
  }

  const handleActionClick = async (item) => {
    // Record click
    try {
      await addDoc(collection(db, "announcement_clicks"), {
        campaignId: item.id,
        userId: userId || 'guest',
        timestamp: serverTimestamp()
      })
    } catch (e) {
      console.error("Error logging click clickthrough:", e)
    }

    if (item.actionLink) {
      router.push(item.actionLink)
    }
  }

  if (announcements.length === 0) return null

  const activeItem = announcements[currentIndex]

  return (
    <div className={cn(
      "relative w-full overflow-hidden transition-all duration-500 rounded-3xl shadow-sm border border-emerald-100 flex items-center p-4 min-h-[64px]",
      activeItem.priority === 'Critical' 
        ? "bg-rose-50/90 text-rose-950 border-rose-100 animate-pulse" 
        : activeItem.priority === 'High'
          ? "bg-amber-50/90 text-amber-950 border-amber-100"
          : "bg-emerald-50/60 text-emerald-950"
    )}>
      {/* Icon */}
      <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-white/80 text-emerald-700 mr-3 shadow-sm">
        <Megaphone className="h-4 w-4" />
      </div>

      {/* Content Text */}
      <div className="flex-1 pr-16 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">
            {activeItem.category || 'Platform Update'}
          </span>
          {activeItem.priority && activeItem.priority !== 'Low' && (
            <span className={cn(
              "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider leading-none",
              activeItem.priority === 'Critical' ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
            )}>
              {activeItem.priority}
            </span>
          )}
        </div>
        <p className="text-xs font-bold mt-0.5 leading-snug truncate">
          {activeItem.title}: <span className="font-semibold text-slate-700/90 ml-1">{activeItem.content}</span>
        </p>
      </div>

      {/* Action triggers */}
      <div className="absolute right-3 flex items-center gap-1.5">
        {activeItem.actionLink && (
          <Button
            size="sm"
            onClick={() => handleActionClick(activeItem)}
            className="h-8 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-black rounded-xl px-3 flex items-center gap-1 shadow-sm shrink-0"
          >
            {activeItem.actionText || 'View'}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
        
        {/* Navigation triggers if multiple announcements exist */}
        {announcements.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <button onClick={handlePrev} className="h-7 w-7 rounded-lg bg-white hover:bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleNext} className="h-7 w-7 rounded-lg bg-white hover:bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dismiss trigger */}
        <button
          onClick={(e) => handleDismiss(e, activeItem.id)}
          className="h-7 w-7 rounded-full bg-white/70 hover:bg-white text-slate-400 hover:text-red-500 flex items-center justify-center border shadow-sm transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
