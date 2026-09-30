'use client'

import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  IndianRupee,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState, useMemo } from 'react'
import { useOrders } from '@/lib/order-context'
import { useSellers } from '@/lib/seller-context'
import { useProducts } from '@/lib/product-context'
import { useAdminUsers } from '@/lib/admin-users-context'
import { toast } from 'sonner'
import { Truck, Store, AlertTriangle } from 'lucide-react'
import { categories } from '@/lib/mock-data'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts'

export default function SellerDashboard() {
  const { orders: allOrders } = useOrders()
  const { currentSeller, calculateSellerRating } = useSellers()
  const { products } = useProducts()
  const { users } = useAdminUsers()
  const { acceptOrder, assignDeliveryBoy } = useOrders()
  const [selectedBoys, setSelectedBoys] = useState({})
  
  const [upgradeCategoryDialog, setUpgradeCategoryDialog] = useState(false)
  const [selectedUpgradeCategory, setSelectedUpgradeCategory] = useState('')
  const { requestCategoryUpgrade } = useSellers()

  const sellerId = currentSeller?.id || 'seller-1'

  // Filter products for this seller
  const sellerProducts = products.filter(p => p.sellerId === sellerId)

  // Filter orders for this seller (Memoized for real-time reactivity)
  const sellerOrders = useMemo(() => {
    return allOrders.filter(order =>
      order.items?.some(item => item.sellerId === sellerId)
    )
  }, [allOrders, sellerId])
  
  // Calculate stats (Memoized)
  const { totalRevenue, pendingOrdersCount, completedOrdersCount, cancelledOrdersCount } = useMemo(() => {
    let revenue = 0
    let pending = 0
    let completed = 0
    let cancelled = 0

    sellerOrders.forEach(order => {
      const status = order.status?.toLowerCase() || 'pending'
      
      // Revenue calculation for active orders
      if (!['cancelled', 'returned'].includes(status)) {
        const sellerItems = order.items.filter(item => item.sellerId === sellerId)
        const orderTotal = sellerItems.reduce((s, i) => s + (Number(i.pricePerUnit) * Number(i.quantity)), 0)
        revenue += (orderTotal * 0.95)
      }

      // Count by status groups
      if (['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(status)) {
        pending++
      } else if (status === 'delivered') {
        completed++
      } else if (['cancelled', 'returned'].includes(status)) {
        cancelled++
      }
    })

    return { 
      totalRevenue: revenue, 
      pendingOrdersCount: pending, 
      completedOrdersCount: completed, 
      cancelledOrdersCount: cancelled 
    }
  }, [sellerOrders, sellerId])

  // Calculate dynamic growth percentages (current month vs last month)
  const growthMetrics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const calculateStatsForPeriod = (month, year) => {
      let revenue = 0
      let count = 0
      
      sellerOrders.forEach(order => {
        const orderDate = new Date(order.createdAt)
        if (orderDate.getMonth() === month && orderDate.getFullYear() === year && !['cancelled', 'returned'].includes(order.status?.toLowerCase())) {
          const sellerItems = order.items.filter(item => item.sellerId === sellerId)
          revenue += sellerItems.reduce((s, i) => s + (i.pricePerUnit * i.quantity), 0) * 0.95
          count++
        }
      })
      return { revenue, count }
    }

    const current = calculateStatsForPeriod(currentMonth, currentYear)
    const previous = calculateStatsForPeriod(lastMonth, lastMonthYear)

    const calculateChange = (cur, prev) => {
      if (prev === 0) return cur > 0 ? 100 : 0
      return Math.round(((cur - prev) / prev) * 100)
    }

    return {
      revenueChange: calculateChange(current.revenue, previous.revenue),
      ordersChange: calculateChange(current.count, previous.count)
    }
  }, [sellerOrders, sellerId])

  // Dynamic Sales Data for Chart (Last 15 days)
  const salesData = useMemo(() => {
    const days = 15
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayRevenue = sellerOrders
        .filter(o => {
          const oDate = typeof o.createdAt === 'string' ? o.createdAt : o.createdAt?.toDate?.().toISOString() || ''
          return oDate.startsWith(dateStr) && !['cancelled', 'returned'].includes(o.status?.toLowerCase())
        })
        .reduce((sum, o) => {
          const sellerItems = o.items.filter(item => item.sellerId === sellerId)
          return sum + sellerItems.reduce((s, i) => s + (i.pricePerUnit * i.quantity), 0) * 0.95
        }, 0)

      data.push({ 
        date: dateStr, 
        revenue: Math.round(dayRevenue),
        displayDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      })
    }
    return data
  }, [sellerOrders, sellerId])

  // Dynamic Top Products
  const topProducts = useMemo(() => {
    const productMap = {}
    sellerOrders
      .filter(o => !['cancelled', 'returned'].includes(o.status?.toLowerCase()))
      .forEach(o => {
        o.items.filter(item => item.sellerId === sellerId).forEach(item => {
          const name = item.productName || item.name || 'Unknown Product'
          if (!productMap[name]) productMap[name] = 0
          productMap[name] += (Number(item.pricePerUnit || 0) * Number(item.quantity || 0)) * 0.95
        })
      })

    return Object.entries(productMap)
      .map(([productName, revenue]) => ({ productName, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [sellerOrders, sellerId])

  const recentOrders = useMemo(() => {
    return [...sellerOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(order => {
        const sellerItems = order.items.filter(item => item.sellerId === sellerId)
        const total = sellerItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0)
        return { ...order, total }
      })
  }, [sellerOrders, sellerId])

  const statCards = [
    {
      title: 'Total Revenue',
      value: `Rs. ${totalRevenue.toLocaleString()}`,
      change: growthMetrics.revenueChange,
      icon: IndianRupee,
    },
    {
      title: 'Total Orders',
      value: sellerOrders.length.toString(),
      change: growthMetrics.ordersChange,
      icon: ShoppingCart,
    },
    {
      title: 'Active Products',
      value: sellerProducts.length.toString(),
      change: 0,
      icon: Package,
    },
    {
      title: 'Avg Rating',
      value: calculateSellerRating(products, sellerId),
      change: 0,
      icon: Star,
    },
  ]

  const orderStatusCards = [
    { label: 'Pending', count: pendingOrdersCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100/50' },
    { label: 'Completed', count: completedOrdersCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
    { label: 'Cancelled', count: cancelledOrdersCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100/50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here&apos;s your store overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change !== 0 && (
                <p className="flex items-center gap-1 text-xs">
                  {stat.change > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">+{stat.change}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{stat.change}%</span>
                    </>
                  )}
                  <span className="text-muted-foreground">from last month</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Business Category Card */}
      <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 mb-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              Business Categories
            </CardTitle>
            <CardDescription>Manage the product categories you are approved to sell</CardDescription>
          </div>
          <Button onClick={() => setUpgradeCategoryDialog(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            Request Category Upgrade
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Approved</p>
              <div className="flex flex-wrap gap-2">
                {currentSeller?.approvedCategories?.length > 0 ? currentSeller.approvedCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId)
                  return cat ? <Badge key={cat.id} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">{cat.name}</Badge> : null
                }) : <span className="text-xs text-slate-400 font-medium">None</span>}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-1.5"><Clock className="h-4 w-4" /> Pending</p>
              <div className="flex flex-wrap gap-2">
                {currentSeller?.pendingCategories?.length > 0 ? currentSeller.pendingCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId)
                  return cat ? <Badge key={cat.id} className="bg-amber-100 text-amber-700 hover:bg-amber-200">{cat.name}</Badge> : null
                }) : <span className="text-xs text-slate-400 font-medium">None</span>}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-3 flex items-center gap-1.5"><XCircle className="h-4 w-4" /> Restricted</p>
              <div className="flex flex-wrap gap-2">
                {currentSeller?.restrictedCategories?.length > 0 ? currentSeller.restrictedCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId)
                  return cat ? <Badge key={cat.id} className="bg-red-100 text-red-700 hover:bg-red-200">{cat.name}</Badge> : null
                }) : <span className="text-xs text-slate-400 font-medium">None</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={upgradeCategoryDialog} onOpenChange={setUpgradeCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Category Upgrade</DialogTitle>
            <DialogDescription>
              Select a category you wish to add to your approved list. This request will be sent to the Admin for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Select value={selectedUpgradeCategory} onValueChange={setSelectedUpgradeCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const isApproved = currentSeller?.approvedCategories?.includes(cat.id)
                    const isPending = currentSeller?.pendingCategories?.includes(cat.id)
                    const isRestricted = currentSeller?.restrictedCategories?.includes(cat.id)
                    return (
                      <SelectItem 
                        key={cat.id} 
                        value={cat.id}
                        disabled={isApproved || isPending}
                      >
                        <div className="flex items-center gap-2">
                          {cat.name}
                          {isApproved && <Badge className="ml-2 text-[8px] h-4 bg-emerald-100 text-emerald-700 px-1 py-0">Approved</Badge>}
                          {isPending && <Badge className="ml-2 text-[8px] h-4 bg-amber-100 text-amber-700 px-1 py-0">Pending</Badge>}
                          {isRestricted && <Badge className="ml-2 text-[8px] h-4 bg-red-100 text-red-700 px-1 py-0">Restricted</Badge>}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {currentSeller?.restrictedCategories?.includes(selectedUpgradeCategory) && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl flex gap-2 text-xs font-bold border border-red-100">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This category was previously restricted for your account. Re-requesting it may require additional verification.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeCategoryDialog(false)}>Cancel</Button>
            <Button 
              disabled={!selectedUpgradeCategory} 
              onClick={async () => {
                await requestCategoryUpgrade(sellerId, selectedUpgradeCategory)
                toast.success('Category upgrade requested successfully!')
                setUpgradeCategoryDialog(false)
                setSelectedUpgradeCategory('')
              }}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {orderStatusCards.map((status) => (
          <Card key={status.label} className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-2xl p-3 ${status.bg} ${status.color}`}>
                <status.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{status.label} Orders</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{status.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="border-none shadow-2xl shadow-emerald-500/10 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-bold tracking-tight text-emerald-950">Revenue Trend</CardTitle>
            <CardDescription className="text-emerald-700/60 font-medium">15-day sales performance</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-8">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    className="text-xs font-black text-slate-400"
                    minTickGap={30}
                    dy={30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000}K`}
                    className="text-xs font-black text-slate-400"
                    dx={-15}
                  />
                  <Tooltip
                    cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '6 6' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none animate-in fade-in zoom-in duration-300 min-w-[200px]">
                            <p className="text-[10px] font-black uppercase tracking-[2px] text-emerald-500 mb-2">Earnings</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-slate-900">Rs.</span>
                              <span className="text-3xl font-black text-slate-900 tracking-tight">{payload[0].value?.toLocaleString()}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-wider">{new Date(payload[0].payload.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ 
                      r: 8, 
                      fill: '#10b981', 
                      stroke: 'white', 
                      strokeWidth: 4, 
                      className: "shadow-2xl shadow-emerald-500/50" 
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => `${value / 1000}K`} className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={100}
                    className="text-xs"
                    tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="text-sm font-medium">{payload[0].payload.productName}</p>
                            <p className="text-xs text-muted-foreground">Rs. {payload[0].value?.toLocaleString()}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 20, 20, 0]} barSize={20}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#064e3b', '#065f46', '#047857', '#059669', '#10b981'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.buyerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Rs. {order.total}</p>
                  <Badge
                    variant="secondary"
                    className={`font-black px-3 py-1 rounded-full uppercase text-[10px] tracking-wider ${
                      ['delivered', 'completed', 'delivered'].includes(order.orderStatus?.toLowerCase() || order.status?.toLowerCase())
                        ? 'bg-emerald-100 text-emerald-700'
                        : ['shipped', 'out_for_delivery', 'picked_up'].includes(order.orderStatus?.toLowerCase() || order.status?.toLowerCase())
                          ? 'bg-blue-100 text-blue-700'
                          : ['pending', 'confirmed', 'processing', 'placed', 'accepted'].includes(order.orderStatus?.toLowerCase() || order.status?.toLowerCase())
                            ? 'bg-amber-100 text-amber-700'
                            : ['cancelled', 'returned'].includes(order.orderStatus?.toLowerCase() || order.status?.toLowerCase())
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {order.orderStatus || order.status}
                  </Badge>

                  {/* Delivery Boy Assignment Logic */}
                  {(order.orderStatus === 'placed' || order.status === 'pending') && (
                    <Button 
                      size="sm" 
                      className="mt-2 w-full bg-green-600 hover:bg-green-700 text-[10px] h-7"
                      onClick={() => acceptOrder(order.id)}
                    >
                      Accept
                    </Button>
                  )}

                  {(order.orderStatus === 'accepted' || (order.status === 'confirmed' && !order.deliveryBoyId)) && (
                    <div className="mt-2 space-y-1">
                      <Select onValueChange={(val) => setSelectedBoys(prev => ({...prev, [order.id]: val}))}>
                        <SelectTrigger className="h-7 text-[10px]">
                          <SelectValue placeholder="Assign Boy" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.role === 'delivery' && u.status === 'active').map(boy => (
                            <SelectItem key={boy.id} value={boy.id} className="text-xs">
                              {boy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full h-7 text-[10px] gap-1"
                        onClick={async () => {
                          const boyId = selectedBoys[order.id];
                          if (!boyId) return toast.error("Select a delivery boy");
                          await assignDeliveryBoy(order.id, boyId);
                          toast.success("Assigned!");
                        }}
                      >
                        <Truck className="h-3 w-3" /> Assign
                      </Button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





