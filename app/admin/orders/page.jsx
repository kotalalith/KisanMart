"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useOrders } from "@/lib/order-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Search,
  MoreHorizontal,
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  RefreshCw,
  Printer,
  MapPin,
  User as UserIcon,
  Store,
  Smartphone
} from "lucide-react"

import { Suspense } from "react"

function AdminOrdersContent() {
  const { orders, loading, updateOrderStatus } = useOrders()
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get('search')
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }
  }, [urlSearch])

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items?.some(item => item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [orders, searchQuery])

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "placed" || o.status === "accepted" || o.status === "confirmed")
  const shippedOrders = orders.filter((o) => o.status === "shipped" || o.status === "picked_up" || o.status === "assigned")
  const deliveredOrders = orders.filter((o) => o.status === "delivered")
  const cancelledOrders = orders.filter((o) => o.status === "cancelled")

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-amber-500" />
      case "shipped": return <Truck className="h-4 w-4 text-purple-500" />
      case "delivered": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled": return <XCircle className="h-4 w-4 text-red-500" />
      default: return <RefreshCw className="h-4 w-4 text-blue-500" />
    }
  }

  const handlePrint = (order) => {
    const printContent = `
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .header { border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AgroBridge Invoice</h1>
            <p>Order ID: ${order.orderNumber} | Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div class="details">
            <div>
              <h3>Buyer Details</h3>
              <p><strong>${order.buyerName}</strong></p>
              <p>${order.buyerPhone}</p>
              <p>${order.address || 'Standard Delivery'}</p>
            </div>
            <div>
              <h3>Platform Details</h3>
              <p>Status: ${order.status.toUpperCase()}</p>
              <p>Payment: ${order.paymentStatus?.toUpperCase() || 'COD'}</p>
            </div>
          </div>
          <table>
            <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr></thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name} (${item.sellerName})</td>
                  <td>${item.quantity} ${item.unit || 'kg'}</td>
                  <td>Rs. ${item.price}</td>
                  <td>Rs. ${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Total: Rs. ${order.totalAmount?.toLocaleString()}</div>
        </body>
      </html>
    `;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(printContent);
    win.document.close();
    win.print();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">Monitor and manage all platform orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-amber-600">Pending</p>
          <p className="text-2xl font-bold">{pendingOrders.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-purple-600">Shipped</p>
          <p className="text-2xl font-bold">{shippedOrders.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <p className="text-sm text-green-600">Delivered</p>
          <p className="text-2xl font-bold">{deliveredOrders.length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Orders</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="bg-muted/50 p-1 rounded-xl border">
              <TabsTrigger value="all" className="rounded-lg px-6 font-bold">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-6 font-bold">Pending</TabsTrigger>
              <TabsTrigger value="shipped" className="rounded-lg px-6 font-bold">Shipped</TabsTrigger>
              <TabsTrigger value="delivered" className="rounded-lg px-6 font-bold">Delivered</TabsTrigger>
            </TabsList>

            {["all", "pending", "shipped", "delivered"].map((status) => (
              <TabsContent key={status} value={status} className="mt-6 border-2 border-muted/30 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="h-14">
                      <TableHead className="font-bold">Order ID</TableHead>
                      <TableHead className="font-bold">Buyer</TableHead>
                      <TableHead className="font-bold">Items</TableHead>
                      <TableHead className="font-bold">Amount</TableHead>
                      <TableHead className="font-bold text-center">Status</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(status === "all" ? filteredOrders : filteredOrders.filter(o => o.status === status)).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2 opacity-40">
                            <ShoppingCart className="h-10 w-10" />
                            <p className="font-medium">No {status} orders found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (status === "all" ? filteredOrders : filteredOrders.filter(o => o.status === status)).map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/20 transition-colors h-16">
                          <TableCell className="font-black text-primary tracking-tighter">
                            {order.orderNumber || order.id.slice(0,8)}
                          </TableCell>
                          <TableCell className="font-medium">{order.buyerName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{order.items?.length} Items</TableCell>
                          <TableCell className="font-bold text-base">Rs. {(order.totalAmount || order.total || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(order.status)}
                              <span className="capitalize text-[10px] font-black tracking-widest">{order.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-medium">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-2 shadow-xl">
                                <DropdownMenuItem onClick={() => setSelectedOrder(order)} className="p-3 gap-2">
                                  <Eye className="h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint(order)} className="p-3 gap-2">
                                  <Printer className="h-4 w-4" /> Print Invoice
                                </DropdownMenuItem>
                                {order.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')} className="p-3 gap-2 text-primary font-bold">
                                    <Truck className="h-4 w-4" /> Mark Shipped
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Admin Detailed View Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Order Details: {selectedOrder.orderNumber}</DialogTitle>
              <DialogDescription>Full platform audit and order metadata</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 border-r pr-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><UserIcon className="h-4 w-4 text-emerald-600" /> Buyer</div>
                  <p className="font-bold text-sm">{selectedOrder.buyerName}</p>
                  <p className="text-xs">{selectedOrder.buyerPhone}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 shrink-0" /> 
                    <span className="truncate">
                      {selectedOrder.shippingAddress 
                        ? `${selectedOrder.shippingAddress.addressLine1}, ${selectedOrder.shippingAddress.city}` 
                        : (selectedOrder.address || 'Standard Location')}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 border-r pr-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Store className="h-4 w-4 text-emerald-600" /> Logistics</div>
                  <p className="text-xs font-semibold">Sellers: {selectedOrder.items?.map(i => i.sellerName || i.sellerId).join(', ')}</p>
                  <p className="text-xs text-slate-500">Created: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs">Status: <Badge className="text-[10px] font-bold rounded-full">{selectedOrder.status}</Badge></p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Smartphone className="h-4 w-4 text-emerald-600" /> Payment</div>
                  <p className="font-black text-sm uppercase text-slate-900">{selectedOrder.paymentMethod || 'UPI'}</p>
                  <p className="text-[11px] text-slate-500 font-semibold">{selectedOrder.paymentStatus}</p>
                  {selectedOrder.utrNumber && <p className="text-[9px] font-mono text-slate-400 mt-1 select-all">UTR: {selectedOrder.utrNumber}</p>}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50"><TableRow><TableHead>Product</TableHead><TableHead>Seller</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{item.name} (x{item.quantity})</TableCell>
                        <TableCell className="text-xs">{item.sellerName}</TableCell>
                        <TableCell className="text-right font-mono">Rs. {item.price * item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="bg-muted/30 p-3 flex justify-between items-center font-bold">
                  <span>Grand Total</span>
                  <span className="text-lg text-primary">Rs. {(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handlePrint(selectedOrder)} className="gap-2"><Printer className="h-4 w-4" /> Print for Records</Button>
              <Button onClick={() => setSelectedOrder(null)}>Close Audit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  )
}





