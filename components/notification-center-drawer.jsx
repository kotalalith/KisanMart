'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Search, 
  Check, 
  CheckCheck,
  Archive, 
  Settings, 
  X, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Tag, 
  Package, 
  User, 
  Inbox,
  Sparkles,
  Trash2,
  RotateCcw,
  ExternalLink,
  PlusCircle,
  Clock,
  Layers
} from 'lucide-react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useNotifications, DEFAULT_NOTIFICATIONS } from '@/lib/notification-context'
import { cn } from '@/lib/utils'

const CATEGORY_META = {
  orders: { label: 'Orders', icon: ShoppingCart, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  payments: { label: 'Payments', icon: CreditCard, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  deliveries: { label: 'Deliveries', icon: Truck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  promotions: { label: 'Offers', icon: Tag, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  inventory: { label: 'Inventory', icon: Package, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  account: { label: 'Account', icon: User, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  default: { label: 'Alerts', icon: Bell, color: 'text-slate-700 bg-slate-100 border-slate-200' }
}

const PRIORITY_META = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  High: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
  Critical: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse'
}

function formatTimeAgo(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function NotificationCenterDrawer({ children }) {
  const { 
    notifications, 
    preferences, 
    markAsRead, 
    markAllAsRead, 
    archiveNotification, 
    restoreNotification,
    deleteNotification,
    trackNotificationClick,
    updatePreferences 
  } = useNotifications()
  
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('inbox') // inbox, archived, preferences
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read && n.status !== 'Archived').length
  }, [notifications])

  const archivedCount = useMemo(() => {
    return notifications.filter(n => n.status === 'Archived').length
  }, [notifications])

  const inboxNotifications = useMemo(() => {
    return notifications.filter(n => n.status !== 'Archived')
  }, [notifications])

  // Count by category for chips
  const categoryCounts = useMemo(() => {
    const counts = { all: inboxNotifications.length }
    for (const notif of inboxNotifications) {
      counts[notif.type] = (counts[notif.type] || 0) + 1
    }
    return counts
  }, [inboxNotifications])

  // Filter and Search logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Tab grouping (status filter)
      if (activeTab === 'inbox' && n.status === 'Archived') return false
      if (activeTab === 'archived' && n.status !== 'Archived') return false
      
      // 2. Category matching
      if (selectedCategory !== 'all' && n.type !== selectedCategory) return false

      // 3. Search query matching
      if (searchQuery.trim()) {
        const text = `${n.title} ${n.message}`.toLowerCase()
        return text.includes(searchQuery.toLowerCase().trim())
      }

      return true
    })
  }, [notifications, activeTab, selectedCategory, searchQuery])

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif.id)
    }
    if (notif.clickAction) {
      await trackNotificationClick(notif.id)
      setOpen(false)
      router.push(notif.clickAction)
    }
  }

  const getCategoryIcon = (type) => {
    const meta = CATEGORY_META[type] || CATEGORY_META.default
    const Icon = meta.icon
    return <Icon className="h-4 w-4" />
  }

  const getCategoryColorClass = (type) => {
    const meta = CATEGORY_META[type] || CATEGORY_META.default
    return meta.color
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative hover:bg-emerald-50 rounded-xl transition-colors">
            <Bell className="h-5 w-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white items-center justify-center text-[9px] font-extrabold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent 
        className="w-full sm:max-w-md p-0 border-l border-slate-200/80 flex flex-col bg-white overflow-hidden shadow-2xl"
      >
        {/* Modern Header */}
        <SheetHeader className="p-5 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white flex flex-col gap-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-extrabold tracking-tight text-slate-900">
                  Notifications
                </SheetTitle>
                <p className="text-[11px] text-slate-400 font-medium">
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'Stay updated with orders & alerts'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 pr-6">
              {activeTab === 'inbox' && unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8 px-2.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl gap-1">
            {[
              { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount },
              { id: 'archived', label: 'Archived', icon: Archive, count: archivedCount },
              { id: 'preferences', label: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-emerald-800 shadow-sm font-extrabold" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                    activeTab === tab.id ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </SheetHeader>

        {activeTab !== 'preferences' ? (
          <>
            {/* Search and Filters Bar */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-white space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search updates, invoices, orders..."
                  className="pl-9 pr-8 h-9 border border-slate-200/80 bg-slate-50/70 focus:bg-white rounded-xl text-xs font-medium focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills (No default ugly scrollbar) */}
              <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1",
                    selectedCategory === 'all'
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                  )}
                >
                  <Layers className="h-3 w-3" />
                  All
                  {categoryCounts.all > 0 && (
                    <span className="text-[10px] opacity-80 font-normal">({categoryCounts.all})</span>
                  )}
                </button>

                {Object.entries(CATEGORY_META).filter(([k]) => k !== 'default').map(([key, meta]) => {
                  const Icon = meta.icon
                  const count = categoryCounts[key] || 0
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCategory(key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
                        selectedCategory === key
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                      {count > 0 && (
                        <span className={cn(
                          "text-[10px] px-1 rounded-full font-bold",
                          selectedCategory === key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                    {activeTab === 'archived' ? <Archive className="h-7 w-7 text-slate-400" /> : <Inbox className="h-7 w-7" />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">
                      {activeTab === 'archived' ? 'No Archived Notifications' : 'All Caught Up!'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed mx-auto">
                      {activeTab === 'archived' 
                        ? 'Notifications you archive will be saved here for your reference.' 
                        : 'No new alerts. You will receive notifications when order statuses change or discounts launch.'}
                    </p>
                  </div>
                  {activeTab === 'inbox' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false)
                        router.push('/categories')
                      }}
                      className="mt-2 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                    >
                      Explore Products
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredNotifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "relative p-4 rounded-2xl border transition-all cursor-pointer group flex gap-3.5 overflow-hidden shadow-sm",
                        notif.read 
                          ? "bg-white border-slate-200/80 hover:border-slate-300" 
                          : "bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300 shadow-emerald-500/5"
                      )}
                    >
                      {/* Left vertical status indicator */}
                      {!notif.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l" />
                      )}

                      {/* Category Icon */}
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 shadow-xs",
                        getCategoryColorClass(notif.type)
                      )}>
                        {getCategoryIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={cn(
                            "text-xs truncate",
                            notif.read ? "font-bold text-slate-700" : "font-extrabold text-slate-900"
                          )}>
                            {notif.title}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {notif.priority && notif.priority !== 'Low' && (
                              <Badge className={cn("text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded-md border font-extrabold", PRIORITY_META[notif.priority])}>
                                {notif.priority}
                              </Badge>
                            )}
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notif.createdAt)}
                          </span>

                          {/* Quick action buttons on hover / mobile */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {activeTab === 'archived' ? (
                              <button
                                type="button"
                                title="Restore to Inbox"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await restoreNotification(notif.id)
                                }}
                                className="p-1 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Archive"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await archiveNotification(notif.id)
                                }}
                                className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              title="Delete"
                              onClick={async (e) => {
                                e.stopPropagation()
                                await deleteNotification(notif.id)
                              }}
                              className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            {notif.clickAction && (
                              <span className="p-1 text-slate-400 group-hover:text-emerald-600">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Preferences Panel */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
                Notification Channels
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose which types of alerts you'd like to receive on your device and dashboard.
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(CATEGORY_META).filter(([k]) => k !== 'default').map(([key, meta]) => {
                const Icon = meta.icon
                return (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", meta.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">{meta.label}</span>
                        <p className="text-[10px] text-slate-400 font-medium">Alerts for {key}</p>
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
                )
              })}
            </div>

            {/* Service Worker PWA Status Banner */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900">Background Sync Active</span>
                <p className="text-[11px] text-emerald-700 leading-relaxed mt-0.5">
                  Real-time push delivery enabled. Alerts are saved securely and synced across your browser sessions.
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
