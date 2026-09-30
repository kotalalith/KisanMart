'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Search, 
  Check, 
  Archive, 
  Settings, 
  X, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Tag, 
  Package, 
  User, 
  HelpCircle,
  Inbox,
  Sparkles
} from 'lucide-react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useNotifications } from '@/lib/notification-context'
import { cn } from '@/lib/utils'

const CATEGORY_META = {
  orders: { label: 'Orders', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  payments: { label: 'Payments', icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  deliveries: { label: 'Deliveries', icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  promotions: { label: 'Offers', icon: Tag, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  inventory: { label: 'Inventory', icon: Package, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  account: { label: 'Account', icon: User, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  default: { label: 'Alerts', icon: Bell, color: 'text-slate-600 bg-slate-50 border-slate-100' }
}

const PRIORITY_META = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-emerald-50 text-emerald-800 border-emerald-150',
  High: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
  Critical: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse'
}

export function NotificationCenterDrawer({ children }) {
  const { 
    notifications, 
    preferences, 
    markAsRead, 
    markAllAsRead, 
    archiveNotification, 
    trackNotificationClick,
    updatePreferences 
  } = useNotifications()
  
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('inbox') // inbox, archived, preferences
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read && n.status !== 'Archived').length
  }, [notifications])

  // Filter and Search logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Tab grouping (status filter)
      if (activeTab === 'inbox' && n.status === 'Archived') return false
      if (activeTab === 'archived' && n.status !== 'Archived') return false
      
      // 2. Category matching
      if (selectedCategory !== 'all' && n.type !== selectedCategory) return false

      // 3. Search query matching
      if (searchQuery) {
        const text = `${n.title} ${n.message}`.toLowerCase()
        return text.includes(searchQuery.toLowerCase())
      }

      return true
    })
  }, [notifications, activeTab, selectedCategory, searchQuery])

  const handleNotificationClick = async (notif, closeSheet) => {
    // Mark as read
    if (!notif.read) {
      await markAsRead(notif.id)
    }
    // Track click event with timestamp for analytics
    if (notif.clickAction) {
      await trackNotificationClick(notif.id)
      router.push(notif.clickAction)
    }
    closeSheet()
  }

  const getCategoryIcon = (type) => {
    const meta = CATEGORY_META[type] || CATEGORY_META.default
    return <meta.icon className="h-4 w-4" />
  }

  const getCategoryColorClass = (type) => {
    const meta = CATEGORY_META[type] || CATEGORY_META.default
    return meta.color
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative hover:bg-slate-50 rounded-xl">
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 border-2 border-white p-0 text-[10px] text-white">
                {unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md p-0 border-l border-emerald-50 flex flex-col bg-white overflow-hidden shadow-2xl">
        <SheetHeader className="p-6 border-b flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-black tracking-tight text-slate-800 uppercase">Notification Center</SheetTitle>
              {unreadCount > 0 && (
                <Badge className="bg-rose-500 text-white font-bold rounded-full text-[10px] h-5 px-1.5 flex items-center justify-center">
                  {unreadCount} New
                </Badge>
              )}
            </div>
            
            {activeTab === 'inbox' && unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 rounded-lg"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-50 p-1 rounded-xl">
            {[
              { id: 'inbox', label: 'Inbox', icon: Inbox },
              { id: 'archived', label: 'Archived', icon: Archive },
              { id: 'preferences', label: 'Preferences', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        {activeTab !== 'preferences' ? (
          <>
            {/* Search and Filters Bar */}
            <div className="p-4 border-b bg-slate-50/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-9 h-9 border-none bg-white shadow-sm rounded-xl text-xs font-semibold focus-visible:ring-emerald-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filters Carousel */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold border transition-all shrink-0",
                    selectedCategory === 'all'
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  All
                </button>
                {Object.entries(CATEGORY_META).filter(([k]) => k !== 'default').map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold border transition-all shrink-0 flex items-center gap-1",
                      selectedCategory === key
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <meta.icon className="h-3 w-3" />
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                    <Bell className="h-6 w-6" />
                  </div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">No notifications found</h3>
                  <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                    We will notify you here when transactions or account changes occur.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredNotifications.map((notif) => (
                    <SheetClose asChild key={notif.id}>
                      <div 
                        onClick={(e) => handleNotificationClick(notif, e.currentTarget.closest('[role="dialog"]').querySelector('button[aria-label="Close"]').click)}
                        className={cn(
                          "relative p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-100 shadow-sm transition-all cursor-pointer group flex gap-3 overflow-hidden",
                          !notif.read && "bg-emerald-50/10 border-emerald-50/50"
                        )}
                      >
                        {/* Status indicators */}
                        {!notif.read && (
                          <div className="absolute top-4 right-4 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        )}

                        {/* Category icon wrapper */}
                        <div className={cn(
                          "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0",
                          getCategoryColorClass(notif.type)
                        )}>
                          {getCategoryIcon(notif.type)}
                        </div>

                        {/* Text values */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-800 truncate">{notif.title}</span>
                            {notif.priority && notif.priority !== 'Low' && (
                              <Badge className={cn("text-[7px] uppercase tracking-widest px-1 py-0.5 rounded border-none font-black leading-none", PRIORITY_META[notif.priority])}>
                                {notif.priority}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed break-words">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-3 pt-1 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            <span>
                              {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {notif.status !== 'Archived' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await archiveNotification(notif.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-all"
                              >
                                <Archive className="h-3 w-3" /> Archive
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SheetClose>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Preferences Panel */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Preferences Toggles</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Configure which transactional notification alerts you want to receive. Opting out will suppress push and background channels.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {Object.entries(CATEGORY_META).filter(([k]) => k !== 'default').map(([key, meta]) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border", meta.color)}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800">{meta.label}</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{key} updates</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[key] !== false}
                    onCheckedChange={(checked) => {
                      updatePreferences({
                        ...preferences,
                        [key]: checked
                      })
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-emerald-50/20 border border-emerald-50 rounded-2xl flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-emerald-800">Background Support Active</span>
                <p className="text-[10px] text-emerald-600 leading-relaxed mt-1">
                  Notifications run in the background using Progressive Web App Service Workers. You will receive notifications even when you are offline or have closed your browser tabs.
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
