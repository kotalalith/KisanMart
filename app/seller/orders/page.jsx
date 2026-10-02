'use client'

import { useState } from 'react'
import { Search, Eye, Truck, CheckCircle2, Clock, XCircle, Package, Printer, UserCircle, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useOrders } from '@/lib/order-context'
import { useSellers } from '@/lib/seller-context'
import { useAdminUsers } from '@/lib/admin-users-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'


const statusConfig = {
  placed: { label: 'Placed', color: 'bg-blue-100 text-blue-700', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-700', icon: Truck },
  picked_up: { label: 'Picked Up', color: 'bg-orange-100 text-orange-700', icon: Package },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-orange-100 text-orange-700', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
}


export default function OrdersPage() {
  const { orders, updateOrderStatus, acceptOrder, assignDeliveryBoy } = useOrders()
  const { currentSeller } = useSellers()
  const { users } = useAdminUsers()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedBoy, setSelectedBoy] = useState('')

  const sellerId = currentSeller?.id || 'seller-1'
  const sellerOrders = orders.filter(o => 
    o.sellerId === sellerId ||
    o.items?.some(item => item.sellerId === sellerId) ||
    (!o.sellerId && (!o.items || o.items.length === 0 || o.items.some(item => !item.sellerId || item.sellerId === 'seller-1' || item.sellerId === sellerId)))
  )

  const filteredOrders = sellerOrders.filter((order) => {
    return (order.orderNumber || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.buyerName?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handlePrint = (order) => {
    const printContent = `
      <html>
        <head>
          <title>Packing Slip - ${order.orderNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #22c55e; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="color: #22c55e; margin: 0;">AgroBridge</h1>
            <p>Order Packing Slip | ID: ${order.orderNumber}</p>
          </div>
          <div class="section">
            <h4 style="margin-bottom: 5px;">SHIP TO:</h4>
            <p style="margin: 0;"><strong>${order.buyerName}</strong></p>
            <p style="margin: 0;">Phone: ${order.buyerPhone}</p>
            <p style="margin: 0;">Address: ${order.address || 'Standard Delivery'}</p>
          </div>
          <div class="section">
            <h4 style="margin-bottom: 5px;">ORDER ITEMS:</h4>
            <table>
              <thead><tr style="background: #f9fafb;"><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>Rs. ${item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="text-align: right; font-weight: bold; font-size: 1.2rem;">Total Revenue: Rs. ${order.totalAmount?.toLocaleString()}</div>
          <div class="footer">Thank you for selling on AgroBridge Marketplace. Please include this slip with the package.</div>
        </body>
      </html>
    `;
    const win = window.open('', '', 'width=700,height=800');
    win.document.write(printContent);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-6 w-full p-4 md:p-8 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Seller Orders</h1>
          <p className="text-muted-foreground">Manage and process your customer orders</p>
        </div>
      </div>

      <Card className="border-2 border-muted/50 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-black tracking-tight">Recent Orders</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by ID or Buyer..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-9 h-11 rounded-xl bg-white border-2 border-muted"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all" className="w-full">
            <div className="px-6 py-4 border-b bg-muted/5">
              <TabsList className="bg-muted/50 p-1 rounded-xl border">
                <TabsTrigger value="all" className="rounded-lg px-8 font-bold">All</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg px-8 font-bold">Pending</TabsTrigger>
                <TabsTrigger value="shipped" className="rounded-lg px-8 font-bold">Shipped</TabsTrigger>
                <TabsTrigger value="delivered" className="rounded-lg px-8 font-bold">Delivered</TabsTrigger>
                <TabsTrigger value="cancelled" className="rounded-lg px-8 font-bold text-red-500">Cancelled</TabsTrigger>
              </TabsList>
            </div>

            {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <TabsContent key={status} value={status} className="mt-0 outline-none">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="h-14">
                        <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Order ID</TableHead>
                        <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Buyer</TableHead>
                        <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Amount</TableHead>
                        <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Payment</TableHead>
                        <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-center">Status</TableHead>
                        <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Date</TableHead>
                        <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const tabOrders = status === 'all' 
                          ? filteredOrders 
                          : filteredOrders.filter(o => o.status === status)

                        if (tabOrders.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-24 text-muted-foreground">
                                <div className="flex flex-col items-center gap-3 opacity-30">
                                  <Package className="h-12 w-12" />
                                  <p className="font-bold text-lg italic tracking-tight">No {status} orders found</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        }

                        return tabOrders.map((order) => {
                          const config = statusConfig[order.status] || statusConfig.pending
                          return (
                            <TableRow key={order.id} className="hover:bg-primary/[0.02] transition-colors h-16 group">
                              <TableCell className="px-6 font-black text-primary tracking-tighter text-base">
                                {order.orderNumber || order.id.slice(0,8)}
                              </TableCell>
                              <TableCell className="px-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">{order.buyerName}</span>
                                  <span className="text-[10px] font-medium text-muted-foreground tracking-tight">{order.buyerPhone}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 text-center font-black text-foreground">
                                Rs. {(order.totalAmount || order.total || 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="px-6 text-center">
                                <div className="flex flex-col items-center">
                                  <Badge className={cn(
                                    "border-none rounded-full px-3.5 py-0.5 font-black text-[9px] uppercase tracking-wider shadow-sm",
                                    order.paymentMethod === 'upi' ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                                  )}>
                                    {order.paymentMethod?.toUpperCase() || 'UPI'}
                                  </Badge>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                                    {order.paymentStatus}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 text-center">
                                <Badge className={`${config.color} border-none rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest shadow-sm`}>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-6 text-muted-foreground text-xs font-bold tracking-tight">
                                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </TableCell>
                              <TableCell className="px-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedOrder(order)} title="View Details">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => handlePrint(order)} title="Print Slip">
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-xl border-2">
          <DialogHeader>
            <DialogTitle className="text-xl">Order Details: {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Review customer details, shipping address, and item list for fulfillment.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (() => {
            const isUpiAwaitingVerify = selectedOrder.paymentMethod === 'upi' && selectedOrder.paymentStatus !== 'Verified'
            const isCod = selectedOrder.paymentMethod === 'cod'

            return (
              <div className="space-y-6 pt-2">
                {/* Warnings */}
                {isUpiAwaitingVerify && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex gap-3 items-center">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                    <div className="text-xs font-semibold text-left">
                      <strong>Awaiting Admin Payment Verification:</strong> Customer paid via UPI, but payment has not yet been verified by administrators. Dispatch action is locked.
                    </div>
                  </div>
                )}
                
                {isCod && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex gap-3 items-center">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-xs font-semibold text-left">
                      <strong>COD Order:</strong> Cash collection pending. Please verify buyer's details ({selectedOrder.buyerPhone}) and address before shipping.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 bg-muted/40 p-4 rounded-xl border text-left">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Customer Details</p>
                    <p className="font-bold text-sm">{selectedOrder.buyerName}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.buyerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Shipping Address</p>
                    <p className="text-xs leading-relaxed">
                      {selectedOrder.shippingAddress ? (
                        `${selectedOrder.shippingAddress.fullName}, ${selectedOrder.shippingAddress.phone}\n${selectedOrder.shippingAddress.addressLine1}, ${selectedOrder.shippingAddress.city}`
                      ) : (selectedOrder.address || 'Standard Delivery')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-wider">Payment Details</p>
                    <p className="font-bold text-xs uppercase text-slate-800">{selectedOrder.paymentMethod || 'UPI'}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">{selectedOrder.paymentStatus}</p>
                    {selectedOrder.utrNumber && <p className="text-[9px] font-mono text-slate-400 mt-1 select-all">UTR: {selectedOrder.utrNumber}</p>}
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-wider">Order Items</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        {selectedOrder.items?.map((item, i) => (
                          <TableRow key={i} className="h-10">
                            <TableCell className="text-sm">
                              <span className="font-bold">{item.productName || item.name}</span>
                              <span className="text-muted-foreground ml-2 text-xs">x {item.quantity}</span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-black">
                              Rs. {(item.pricePerUnit || item.price || 0) * item.quantity}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-3 bg-primary/5 flex justify-between items-center border-t">
                      <span className="font-bold text-sm">Total Revenue</span>
                      <span className="text-primary font-black text-lg">Rs. {(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {(selectedOrder.orderStatus === 'placed' || selectedOrder.status === 'pending') && (
                    <Button 
                      className="w-full h-11 font-bold bg-green-600 hover:bg-green-700" 
                      onClick={() => acceptOrder(selectedOrder.id)}
                      disabled={isUpiAwaitingVerify}
                    >
                      {isUpiAwaitingVerify ? "LOCKED - AWAITING VERIFICATION" : "ACCEPT ORDER"}
                    </Button>
                  )}

                  {(selectedOrder.orderStatus === 'accepted' || (selectedOrder.status === 'confirmed' && !selectedOrder.deliveryBoyId)) && (
                    <div className="space-y-3 p-3 bg-muted/20 rounded-xl border">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Assign Logistics</p>
                      <Select onValueChange={setSelectedBoy} disabled={isUpiAwaitingVerify}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Delivery Boy" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.role === 'delivery' && u.status === 'active').map(boy => (
                            <SelectItem key={boy.id} value={boy.id}>
                              {boy.name} ({boy.deliveryId || 'Pending ID'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        className="w-full gap-2" 
                        onClick={async () => {
                          if (!selectedBoy) return toast.error("Please select a boy");
                          const boy = users.find(u => u.id === selectedBoy);
                          await assignDeliveryBoy(selectedOrder.id, selectedBoy, boy.deliveryId);
                          toast.success("Delivery boy assigned!");
                          setSelectedOrder(null);
                        }}
                        disabled={isUpiAwaitingVerify || !selectedBoy}
                      >
                        <Truck className="h-4 w-4" /> CONFIRM ASSIGNMENT
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2 w-full">
                      <Button 
                        className="flex-1 h-11 font-black bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-100 rounded-xl uppercase tracking-tighter" 
                        variant="outline" 
                        onClick={async () => {
                          await assignDeliveryBoy(selectedOrder.id, sellerId, 'SELF-COURIER');
                          await updateOrderStatus(selectedOrder.id, 'shipped');
                          toast.success("Order marked for self-delivery!");
                          setSelectedOrder(null);
                        }}
                        disabled={isUpiAwaitingVerify}
                      >
                        <UserCircle className="h-4 w-4 mr-2" /> SHIP MANUALLY (SELF)
                      </Button>
                      
                      <Button 
                        className="h-11 font-black bg-slate-900 text-white hover:bg-black rounded-xl uppercase tracking-tighter flex-1" 
                        onClick={async () => {
                          const deliveryBoys = users.filter(u => u.role === 'delivery' && u.status === 'active');
                          if (deliveryBoys.length === 0) return toast.error("No active delivery partners available");
                          
                          const randomBoy = deliveryBoys[Math.floor(Math.random() * deliveryBoys.length)];
                          await assignDeliveryBoy(selectedOrder.id, randomBoy.id, randomBoy.deliveryId);
                          toast.success(`Auto-assigned to ${randomBoy.name}`);
                          setSelectedOrder(null);
                        }}
                        disabled={isUpiAwaitingVerify}
                      >
                        <Zap className="h-4 w-4 mr-2" /> AUTO ASSIGN
                      </Button>
                    </div>
                    
                    <Button variant="outline" className="w-full gap-2 h-11 px-6 rounded-xl font-bold border-2" onClick={() => handlePrint(selectedOrder)}>
                      <Printer className="h-4 w-4" /> PRINT PACKING SLIP
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
