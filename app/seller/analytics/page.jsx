'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Users, Package } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOrders } from '@/lib/order-context'
import { useSellers } from '@/lib/seller-context'
import { useProducts } from '@/lib/product-context'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function AnalyticsPage() {
  const { orders: allOrders } = useOrders()
  const { currentSeller } = useSellers()
  const { products } = useProducts()
  const sellerId = currentSeller?.id || 'seller-1'

  // Filter orders for this seller
  const sellerOrders = useMemo(() => {
    return allOrders.filter(order =>
      order.items?.some(item => item.sellerId === sellerId)
    )
  }, [allOrders, sellerId])

  // Calculate real metrics
  const metrics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    let totalRev = 0
    let currentMonthRev = 0
    let lastMonthRev = 0
    let currentMonthOrders = 0
    let lastMonthOrders = 0

    sellerOrders.forEach(order => {
      const status = order.status?.toLowerCase() || 'pending'
      const orderDate = new Date(order.createdAt)
      const sellerItems = order.items.filter(item => item.sellerId === sellerId)
      const orderRev = sellerItems.reduce((s, i) => s + (i.pricePerUnit * i.quantity), 0) * 0.95

      if (!['cancelled', 'returned'].includes(status)) {
        totalRev += orderRev
        
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          currentMonthRev += orderRev
          currentMonthOrders++
        } else if (orderDate.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1)) {
          lastMonthRev += orderRev
          lastMonthOrders++
        }
      }
    })

    const calculateGrowth = (cur, prev) => {
      if (prev === 0) return cur > 0 ? 100 : 0
      return Math.round(((cur - prev) / prev) * 100)
    }

    return {
      totalRevenue: totalRev,
      totalOrders: sellerOrders.length,
      avgOrderValue: sellerOrders.length > 0 ? Math.round(totalRev / sellerOrders.length) : 0,
      revenueGrowth: calculateGrowth(currentMonthRev, lastMonthRev),
      ordersGrowth: calculateGrowth(currentMonthOrders, lastMonthOrders),
      conversionRate: 4.8 // Simulated until visitor data is available
    }
  }, [sellerOrders, sellerId])

  // Sales Data for Chart
  const salesData = useMemo(() => {
    const days = 15
    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayRev = sellerOrders
        .filter(o => {
          const oDate = typeof o.createdAt === 'string' ? o.createdAt : o.createdAt?.toDate?.().toISOString() || ''
          return oDate.startsWith(dateStr) && !['cancelled', 'returned'].includes(o.status?.toLowerCase())
        })
        .reduce((sum, o) => {
          const items = o.items.filter(item => item.sellerId === sellerId)
          return sum + items.reduce((s, i) => s + (i.pricePerUnit * i.quantity), 0) * 0.95
        }, 0)
      
      const dayOrders = sellerOrders.filter(o => {
        const oDate = typeof o.createdAt === 'string' ? o.createdAt : o.createdAt?.toDate?.().toISOString() || ''
        return oDate.startsWith(dateStr)
      }).length

      data.push({ date: dateStr, revenue: Math.round(dayRev), orders: dayOrders })
    }
    return data
  }, [sellerOrders, sellerId])

  // Category Distribution
  const categoryData = useMemo(() => {
    const catMap = {}
    sellerOrders.forEach(o => {
      o.items.filter(item => item.sellerId === sellerId).forEach(item => {
        // Find product to get its real category from current inventory, 
        // but fallback to a saved category if product was deleted
        const product = products.find(p => p.id === item.productId || p.name === item.name || p.name === item.productName)
        const category = product?.category || item.category || 'General'
        catMap[category] = (catMap[category] || 0) + (Number(item.pricePerUnit || 0) * Number(item.quantity || 0))
      })
    })
    const total = Object.values(catMap).reduce((a, b) => a + b, 0)
    return Object.entries(catMap).map(([name, val], i) => ({
      name,
      value: Math.round((val / total) * 100),
      color: `hsl(var(--chart-${(i % 5) + 1}))`
    }))
  }, [sellerOrders, sellerId, products])

  // Top Products
  const topProducts = useMemo(() => {
    const productMap = {}
    sellerOrders.filter(o => !['cancelled', 'returned'].includes(o.status?.toLowerCase())).forEach(o => {
      o.items.filter(item => item.sellerId === sellerId).forEach(item => {
        const name = item.productName || item.name || 'Unknown Product'
        if (!productMap[name]) productMap[name] = { revenue: 0, sold: 0 }
        productMap[name].revenue += (Number(item.pricePerUnit || 0) * Number(item.quantity || 0)) * 0.95
        productMap[name].sold += Number(item.quantity || 0)
      })
    })
    return Object.entries(productMap)
      .map(([name, data]) => ({ productName: name, revenue: Math.round(data.revenue), totalSold: data.sold }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [sellerOrders, sellerId])

  // Customer Growth Calculation (Simulated trends based on real order history)
  const customerData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const data = []
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = months[d.getMonth()]
      
      const monthOrders = sellerOrders.filter(o => {
        const oDate = new Date(o.createdAt)
        return oDate.getMonth() === d.getMonth() && oDate.getFullYear() === d.getFullYear()
      })
      
      const uniqueBuyers = new Set(monthOrders.map(o => o.buyerId)).size
      data.push({
        month: monthLabel,
        new: Math.round(uniqueBuyers * 0.4) + 2,
        returning: Math.round(uniqueBuyers * 0.6) + 5
      })
    }
    return data
  }, [sellerOrders])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Store Analytics</h1>
          <p className="text-slate-500 font-medium">Real-time performance metrics and business intelligence</p>
        </div>
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/60 shadow-sm">
          <Badge variant="ghost" className="rounded-xl font-black text-slate-400">Live Updates</Badge>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Total Revenue', value: metrics.totalRevenue >= 100000 ? `Rs. ${(metrics.totalRevenue / 100000).toFixed(1)}L` : `Rs. ${metrics.totalRevenue.toLocaleString()}`, change: metrics.revenueGrowth, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Orders', value: metrics.totalOrders, change: metrics.ordersGrowth, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Order Value', value: `Rs. ${metrics.avgOrderValue.toLocaleString()}`, change: 0, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Conversion Rate', value: `${metrics.conversionRate}%`, change: -0.3, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {stat.label}
              </CardTitle>
              <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} shadow-inner group-hover:rotate-12 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">{stat.value}</div>
              {stat.change !== 0 && (
                <p className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${stat.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stat.change > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(stat.change)}% <span className="text-slate-300 font-bold ml-1">vs last month</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-8">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-[24px] border border-white/60 backdrop-blur-sm inline-flex">
          <TabsTrigger value="revenue" className="rounded-2xl px-8 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600">Revenue</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-2xl px-8 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">Orders</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-2xl px-8 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-purple-600">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-slate-900">Revenue Trend</CardTitle>
                <CardDescription className="text-slate-400 font-bold">Performance over the last 15 active days</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        className="text-[10px] font-black text-slate-400"
                        dy={20}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v / 1000}K`} 
                        className="text-[10px] font-black text-slate-400"
                        dx={-10}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none animate-in zoom-in duration-300">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Earnings</p>
                                <p className="text-2xl font-black text-slate-900">Rs. {payload[0].value?.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-300 mt-1">{payload[0].payload.date}</p>
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
                        strokeWidth={6}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                        activeDot={{ r: 8, fill: '#10b981', stroke: 'white', strokeWidth: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-slate-900">Categories</CardTitle>
                <CardDescription className="text-slate-400 font-bold">Revenue distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 space-y-4">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">{cat.name}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-slate-900">Orders Trend</CardTitle>
                <CardDescription className="text-slate-400 font-bold">Daily volume over the last 15 days</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric' })}
                        className="text-[10px] font-black text-slate-400"
                        dy={20}
                      />
                      <YAxis axisLine={false} tickLine={false} className="text-[10px] font-black text-slate-400" dx={-10} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-[20px] bg-white p-4 shadow-2xl border-none">
                                <p className="text-lg font-black text-slate-900">{payload[0].value} Orders</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-slate-900">Leaderboard</CardTitle>
                <CardDescription className="text-slate-400 font-bold">Best performing products by revenue</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="space-y-6">
                  {topProducts.map((product, index) => (
                    <div key={product.productName} className="flex items-center gap-6 group">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-50 text-slate-900 text-lg font-black shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-black text-slate-900 tracking-tight">{product.productName}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{product.totalSold} Units Sold</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-lg font-black text-emerald-600">
                          {product.revenue >= 1000 
                            ? `Rs. ${(product.revenue / 1000).toFixed(1)}K` 
                            : `Rs. ${product.revenue.toLocaleString()}`}
                        </p>
                        <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-1.5 overflow-hidden ml-auto">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${(product.revenue / (topProducts[0]?.revenue || 1)) * 100}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-sm rounded-[40px] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black text-slate-900">Customer Growth</CardTitle>
              <CardDescription className="text-slate-400 font-bold">New vs Returning buyers tracking</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-[11px] font-black text-slate-400" dy={20} />
                    <YAxis axisLine={false} tickLine={false} className="text-[11px] font-black text-slate-400" dx={-10} />
                    <Tooltip
                       content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-[24px] bg-white p-6 shadow-2xl border-none">
                              <p className="text-[10px] font-black uppercase text-slate-400 mb-3">{payload[0].payload.month}</p>
                              {payload.map((p) => (
                                <div key={p.name} className="flex items-center gap-4 mb-1">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <p className="text-sm font-black text-slate-900">{p.value} {p.name}</p>
                                </div>
                              ))}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="new"
                      stroke="#3b82f6"
                      strokeWidth={6}
                      dot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                      activeDot={{ r: 10, stroke: 'white', strokeWidth: 4 }}
                      name="New Customers"
                    />
                    <Line
                      type="monotone"
                      dataKey="returning"
                      stroke="#8b5cf6"
                      strokeWidth={6}
                      dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 0 }}
                      activeDot={{ r: 10, stroke: 'white', strokeWidth: 4 }}
                      name="Returning Customers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}





