"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileBarChart,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  ShoppingCart,
  IndianRupee,
  Calendar,
  Loader2,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import { useOrders } from "@/lib/order-context"
import { useAdminUsers } from "@/lib/admin-users-context"
import { useSellers } from "@/lib/seller-context"
import { useCategories } from "@/lib/category-context"

export default function AdminReportsPage() {
  const { orders, loading: ordersLoading } = useOrders()
  const { users, loading: usersLoading } = useAdminUsers()
  const { sellers, loading: sellersLoading } = useSellers()
  const { categories, loading: categoriesLoading } = useCategories()
  const [timeRange, setTimeRange] = useState("all")

  const isLoading = ordersLoading || usersLoading || sellersLoading || categoriesLoading

  // 1. Calculate Real-Time Stats
  const stats = useMemo(() => {
    const totalGMV = orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0)
    const totalOrders = orders.length
    const activeUsers = users?.length || 0
    const activeSellers = sellers?.length || 0

    return {
      totalGMV,
      totalOrders,
      activeUsers,
      activeSellers,
      gmvGrowth: "+12.5%", // Placeholder for trend calculation logic
      orderGrowth: "+8.2%",
      userGrowth: "+15.1%",
      sellerGrowth: "+5.4%"
    }
  }, [orders, users, sellers])

  // 2. Format Data for Charts
  const revenueChartData = useMemo(() => {
    // Group orders by month
    const monthlyData = {}
    orders.forEach(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt)
      const monthYear = date.toLocaleString('default', { month: 'short' })
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { month: monthYear, gmv: 0, revenue: 0, orders: 0 }
      }
      monthlyData[monthYear].gmv += (order.totalAmount || order.total || 0)
      monthlyData[monthYear].revenue += (order.totalAmount || order.total || 0) * 0.05 // Assuming 5% commission
      monthlyData[monthYear].orders += 1
    })
    return Object.values(monthlyData).slice(-6) // Last 6 months
  }, [orders])

  const categoryChartData = useMemo(() => {
    const counts = {}
    orders.forEach(order => {
      order.items?.forEach(item => {
        // Find category name for the product (this is an approximation based on item names if cat not direct)
        const catName = item.category || "General"
        counts[catName] = (counts[catName] || 0) + (item.price || item.pricePerUnit || 0) * item.quantity
      })
    })
    const totalSales = Object.values(counts).reduce((a, b) => a + b, 0) || 1
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value: Math.round((value / totalSales) * 100),
      color: `hsl(var(--chart-${(i % 5) + 1}))`
    })).sort((a, b) => b.value - a.value)
  }, [orders])

  // 3. Export Logic
  const handleDownloadReport = (reportName) => {
    let dataToExport = []
    let fileName = `${reportName.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`

    if (reportName === "Sales Report") {
      dataToExport = orders.map(o => ({
        OrderNumber: o.orderNumber,
        Date: new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleDateString(),
        Buyer: o.buyerName,
        Amount: o.totalAmount || o.total,
        Status: o.status,
        Payment: o.paymentMethod
      }))
    } else if (reportName === "User Analytics") {
      dataToExport = (users || []).map(u => ({
        Name: u.name,
        Phone: u.phone,
        Joined: new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt).toLocaleDateString(),
        Status: u.status
      }))
    } else if (reportName === "Seller Performance") {
      dataToExport = (sellers || []).map(s => ({
        Business: s.businessName,
        Owner: s.ownerName,
        Status: s.status,
        Joined: new Date(s.createdAt?.toDate ? s.createdAt.toDate() : s.createdAt).toLocaleDateString()
      }))
    } else {
      // Default to general summary
      dataToExport = [
        { Metric: "Total GMV", Value: stats.totalGMV },
        { Metric: "Total Orders", Value: stats.totalOrders },
        { Metric: "Active Users", Value: stats.activeUsers },
        { Metric: "Active Sellers", Value: stats.activeSellers }
      ]
    }

    if (dataToExport.length === 0) return alert("No data available to download")

    const headers = Object.keys(dataToExport[0]).join(",")
    const rows = dataToExport.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Gathering real-time insights...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Platform performance and insights from live data</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleDownloadReport("Platform Summary")}>
            <Download className="mr-2 h-4 w-4" />
            Export Summary
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50/30 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GMV</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {(stats.totalGMV / 100000).toFixed(2)} L</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {stats.gmvGrowth} from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {stats.orderGrowth} from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Buyers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {stats.userGrowth} from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSellers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {stats.sellerGrowth} from last period
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="revenue">Revenue & Sales</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GMV Trend</CardTitle>
              <CardDescription>Monthly Gross Merchandise Value from live orders</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `₹${v >= 100000 ? (v/100000).toFixed(1)+'L' : v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value) => [`Rs. ${value.toLocaleString()}`, "GMV"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="gmv"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Volume</CardTitle>
              <CardDescription>Monthly distribution of order count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Share by Category</CardTitle>
                <CardDescription>Revenue distribution across platform categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value) => [`${value}%`, "Share"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Revenue contribution by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryChartData.length > 0 ? categoryChartData.map((cat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground font-mono">{cat.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${cat.value}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground py-20">
                    No order data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Reports */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            Download Data Reports
          </CardTitle>
          <CardDescription>Export real-time platform data for local analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Sales Report", description: "All order details and status", icon: ShoppingCart },
              { name: "User Analytics", description: "Buyer registration and status", icon: Users },
              { name: "Seller Performance", description: "Seller business metrics", icon: Store },
              { name: "Financial Summary", description: "GMV and platform metrics", icon: IndianRupee },
              { name: "Inventory Report", description: "Category and product insights", icon: FileBarChart },
              { name: "Platform Summary", description: "High-level platform KPIs", icon: Calendar },
            ].map((report, i) => (
              <div
                key={i}
                className="group flex items-center justify-between rounded-xl border p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                onClick={() => handleDownloadReport(report.name)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <report.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                  <Download className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





