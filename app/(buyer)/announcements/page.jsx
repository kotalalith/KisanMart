'use client'

import { useState, useEffect } from 'react'
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
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, Calendar, ArrowRight, Tag, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS = {
  updates: Sparkles,
  features: Sparkles,
  maintenance: ShieldAlert,
  policies: HelpCircle,
  rewards: Tag,
  referrals: Tag,
  promotions: Tag
}

const CATEGORY_COLORS = {
  updates: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  features: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  maintenance: 'bg-rose-50 text-rose-700 border-rose-100',
  policies: 'bg-slate-50 text-slate-700 border-slate-100',
  rewards: 'bg-blue-50 text-blue-700 border-blue-100',
  referrals: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  promotions: 'bg-amber-50 text-amber-700 border-amber-100'
}

export default function AnnouncementsFeed() {
  const router = useRouter()
  const { userId } = useUser()
  const [announcements, setAnnouncements] = useState([])
  const [selectedTab, setSelectedTab] = useState('all')

  useEffect(() => {
    // Sync published announcements for feed display
    const q = query(
      collection(db, "announcements"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date()
      const list = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            startAt: data.startAt?.toDate?.() || null,
            endAt: data.endAt?.toDate?.() || null,
            createdAt: data.createdAt?.toDate?.() || new Date()
          }
        })
        .filter(item => {
          // Check targets (buyers or all)
          const matchesAudience = item.targetAudience === 'all' || item.targetAudience === 'buyer'
          if (!matchesAudience) return false

          // Check visible schedules
          if (item.startAt && item.startAt > now) return false
          if (item.endAt && item.endAt < now) return false

          return true
        })

      setAnnouncements(list)
    })

    return () => unsubscribe()
  }, [])

  const filteredList = announcements.filter(item => {
    if (selectedTab === 'all') return true
    if (selectedTab === 'platform' && ['updates', 'features', 'maintenance', 'policies'].includes(item.category)) return true
    if (selectedTab === 'rewards' && ['rewards', 'referrals', 'promotions'].includes(item.category)) return true
    return item.category === selectedTab
  })

  const handleActionClick = async (item) => {
    // Record click
    try {
      await addDoc(collection(db, "announcement_clicks"), {
        campaignId: item.id,
        userId: userId || 'guest',
        timestamp: serverTimestamp()
      })
    } catch (e) {
      console.error(e)
    }

    if (item.actionLink) {
      router.push(item.actionLink)
    }
  }

  const getIcon = (cat) => {
    const IconComponent = CATEGORY_ICONS[cat] || Megaphone
    return <IconComponent className="h-5 w-5" />
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Header Hero banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-[10px] uppercase tracking-widest px-3 py-1">
            Platform Communications
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Platform Announcements</h1>
          <p className="text-xs md:text-sm text-emerald-100/70 max-w-lg mx-auto font-medium leading-relaxed">
            Stay up to date with the latest features, seasonal harvest programs, referrals, and marketplace improvements on KisaNetra.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Category Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Announcements' },
            { id: 'platform', label: 'Platform & Updates' },
            { id: 'rewards', label: 'Rewards & Offers' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                selectedTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Announcements List */}
        {filteredList.length === 0 ? (
          <Card className="border-none shadow-sm rounded-3xl p-16 text-center">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                <Megaphone className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider">No Announcements Found</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                There are no published announcements matching this category right now. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredList.map((item) => (
              <Card 
                key={item.id} 
                className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300 group"
              >
                {item.imageUrl && (
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                    />
                  </div>
                )}
                
                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0",
                        CATEGORY_COLORS[item.category] || CATEGORY_COLORS.updates
                      )}>
                        {getIcon(item.category)}
                      </div>
                      <Badge className={cn("text-[9px] uppercase tracking-widest border-none px-2.5 py-0.5 font-black", CATEGORY_COLORS[item.category])}>
                        {item.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
                      {item.content}
                    </p>
                  </div>

                  {item.actionLink && (
                    <div className="pt-2 border-t border-slate-50 flex justify-end">
                      <Button
                        onClick={() => handleActionClick(item)}
                        className="rounded-xl bg-slate-900 text-white hover:bg-black font-black uppercase text-[10px] tracking-widest h-10 px-5 flex items-center gap-1.5"
                      >
                        {item.actionText || 'Read Details'}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
