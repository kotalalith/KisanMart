"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  Search,
  Download,
  Smartphone,
  ShieldCheck,
  History,
  AlertTriangle,
  Loader2,
  FileCheck,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { calculatePayoutBreakdown } from "@/lib/payout-utils"
import { useOrders } from "@/lib/order-context"
import { useNotifications } from "@/lib/notification-context"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import { logPaymentAction, sweepExpiredPayments } from "@/lib/payment-audit-service"

export default function AdminPaymentsPage() {
  const { orders } = useOrders()
  const { sendMultiChannelNotification } = useNotifications()
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [directPayments, setDirectPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [remarksInputs, setRemarksInputs] = useState({}) // paymentId -> string

  // Sweep expired payments on mount
  useEffect(() => {
    const runSweep = async () => {
      try {
        const expiredCount = await sweepExpiredPayments()
        if (expiredCount > 0) {
          toast.success(`Automatically expired ${expiredCount} unpaid/unverified payments.`)
        }
      } catch (err) {
        console.error("Auto expiration sweep failed", err)
      }
    }
    runSweep()
  }, [])

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  // Real-time Payments Listener
  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateString: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
      }))
      setDirectPayments(list)
      setLoadingPayments(false)
    }, (err) => {
      console.error("Firestore payments listener failed", err)
      setLoadingPayments(false)
    })
    return () => unsubscribe()
  }, [])

  // Filter Logic
  const filteredBankPayments = useMemo(() => {
    return directPayments.filter(p => {
      const date = new Date(p.dateString)
      const monthMatch = selectedMonth === "all" || months[date.getMonth()] === selectedMonth
      const yearMatch = selectedYear === "all" || date.getFullYear().toString() === selectedYear
      
      const paymentStatusValue = p.paymentStatus || 'Pending Verification'
      const statusMatch = selectedStatus === "all" || paymentStatusValue.toLowerCase() === selectedStatus.toLowerCase()
      
      const searchMatch = 
        !searchQuery ||
        p.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.buyerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.utrNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.paymentId?.toLowerCase().includes(searchQuery.toLowerCase())

      let dateRangeMatch = true
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        dateRangeMatch = dateRangeMatch && date >= start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        dateRangeMatch = dateRangeMatch && date <= end
      }
      
      return monthMatch && yearMatch && statusMatch && searchMatch && dateRangeMatch
    })
  }, [directPayments, selectedMonth, selectedYear, selectedStatus, searchQuery, startDate, endDate])

  // Summaries
  const verifiedBankTotal = useMemo(() => {
    return directPayments
      .filter(p => p.paymentStatus === 'Verified')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }, [directPayments])

  const pendingVerificationTotal = useMemo(() => {
    return directPayments
      .filter(p => p.paymentStatus === 'Pending Verification')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }, [directPayments])

  const codPendingTotal = useMemo(() => {
    return directPayments
      .filter(p => p.paymentStatus === 'COD Pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }, [directPayments])

  // Payout Logic: First Come First Serve (delivered orders > 5 days ago)
  const payoutsDue = useMemo(() => {
    const now = new Date()
    return orders
      .filter(o => o.status === 'delivered' && (o.paymentStatus === 'Verified' || o.paymentStatus === 'Completed'))
      .map(order => {
        const deliveryDate = order.updatedAt?.toDate ? order.updatedAt.toDate() : new Date(order.updatedAt || order.createdAt)
        const daysSinceDelivery = Math.floor((now - deliveryDate) / (1000 * 60 * 60 * 24))
        const { sellerPayout, platformFee } = calculatePayoutBreakdown(order.subtotal || 0)
        return { 
          ...order, 
          daysSinceDelivery, 
          sellerPayout, 
          platformFee,
          isReady: daysSinceDelivery >= 5 
        }
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }, [orders])

  const totalPendingPayouts = useMemo(() => {
    return payoutsDue.reduce((sum, p) => sum + p.sellerPayout, 0)
  }, [payoutsDue])

  const handleVerifyPayment = async (paymentId, orderId, remarks = "") => {
    try {
      const payRef = doc(db, "payments", paymentId)
      await updateDoc(payRef, {
        paymentStatus: 'Verified',
        verifiedBy: 'admin',
        verifiedAt: serverTimestamp(),
        remarks: remarks
      })

      if (orderId) {
        const orderRef = doc(db, "orders", orderId)
        await updateDoc(orderRef, {
          paymentStatus: 'Verified',
          orderStatus: 'placed' // remains placed but unlocked for seller to ship
        })
      }

      await logPaymentAction(
        paymentId,
        orderId || "",
        "approval",
        "admin",
        remarks || "Payment approved by administrator."
      )

      // Notify Buyer of payment verification success
      const paymentObj = directPayments.find(p => p.id === paymentId)
      if (paymentObj) {
        const buyerId = paymentObj.userId || paymentObj.buyerId
        if (buyerId) {
          await sendMultiChannelNotification({
            recipientId: buyerId,
            title: "UPI Payment Approved",
            message: `Your payment of ₹${paymentObj.amount} for order #${paymentObj.orderNumber || orderId} has been verified successfully.`,
            type: 'payments',
            priority: 'High',
            clickAction: '/orders'
          })
        }
      }

      toast.success("Payment verified successfully!")
    } catch (e) {
      console.error("Failed to verify payment", e)
      toast.error("Verification failed. Please try again.")
    }
  }

  const handleRejectPayment = async (paymentId, orderId, remarks = "") => {
    if (!remarks) {
      toast.error("Please provide a reason / remark for rejecting this payment.")
      return
    }

    try {
      const payRef = doc(db, "payments", paymentId)
      await updateDoc(payRef, {
        paymentStatus: 'Rejected',
        verifiedBy: 'admin',
        verifiedAt: serverTimestamp(),
        remarks: remarks
      })

      if (orderId) {
        const orderRef = doc(db, "orders", orderId)
        await updateDoc(orderRef, {
          paymentStatus: 'Rejected',
          orderStatus: 'cancelled' // reject UPI drops order
        })
      }

      await logPaymentAction(
        paymentId,
        orderId || "",
        "rejection",
        "admin",
        remarks
      )

      // Notify Buyer of payment rejection details
      const paymentObj = directPayments.find(p => p.id === paymentId)
      if (paymentObj) {
        const buyerId = paymentObj.userId || paymentObj.buyerId
        if (buyerId) {
          await sendMultiChannelNotification({
            recipientId: buyerId,
            title: "UPI Payment Rejected",
            message: `Your payment of ₹${paymentObj.amount} was rejected. Reason: ${remarks}`,
            type: 'payments',
            priority: 'Critical',
            clickAction: '/orders'
          })
        }
      }

      toast.success("Payment marked as rejected.")
    } catch (e) {
      console.error("Failed to reject payment", e)
      toast.error("Rejection update failed.")
    }
  }

  const handlePayNow = (sellerName, amount) => {
    const mockSellerUpi = `${sellerName.toLowerCase().replace(/\s/g, '')}@okaxis`
    const upiUrl = `upi://pay?pa=${mockSellerUpi}&pn=${encodeURIComponent(sellerName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Payout for AgroMarket Orders`)}`
    if (confirm(`Open UPI app to pay Rs. ${amount} to ${sellerName}?`)) {
      window.location.href = upiUrl
    }
  }

  const handleExportBank = () => {
    const filename = `kisanetra_payments_${new Date().toISOString().split('T')[0]}.csv`
    const csvContent = "data:text/csv;charset=utf-8," + "Customer,Amount,Method,UTR,Date,Status,Remarks\n" + 
      filteredBankPayments.map(p => `"${p.buyerName || 'Guest'}",${p.amount},"${p.paymentMethod || 'UPI'}","${p.utrNumber || ''}","${new Date(p.dateString).toLocaleString()}","${p.paymentStatus}","${p.remarks || ''}"`).join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", filename)
    link.click()
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[#fdfdfd] min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full w-fit text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <ShieldCheck className="h-3 w-3" />
            Verified Financial Portal
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Payment Verification Panel</h1>
          <p className="text-slate-500 font-medium max-w-lg">Verify customer UTR reference numbers and manage settlements manually.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by UTR, Name, Phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[240px] border-none focus-visible:ring-0 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 border-l pl-3">
            <span className="text-xs font-bold text-slate-400">From:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 rounded-xl px-3 h-9 border-none outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">To:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 rounded-xl px-3 h-9 border-none outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[155px] border-none focus:ring-0 font-bold text-slate-700 bg-slate-50 rounded-xl">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="Pending Payment">Pending Payment</SelectItem>
              <SelectItem value="Pending Verification">Pending UTR</SelectItem>
              <SelectItem value="Verified">Verified UPI</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="COD Pending">COD Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group transition-all hover:scale-[1.02]">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Building className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em]">Verified Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">₹{verifiedBankTotal.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-emerald-200 text-[10px] mt-1 font-bold">
              <History className="h-3 w-3" /> Real-time database sync active
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Pending UTR Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">₹{pendingVerificationTotal.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Awaiting administrator verification</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">COD Pending Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-600">₹{codPendingTotal.toLocaleString()}</div>
            <p className="text-[10px] text-indigo-400 mt-1 font-bold tracking-tight uppercase">Cash to collect on delivery</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm bg-amber-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">Sellers Payout Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">₹{totalPendingPayouts.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-amber-500 text-[10px] mt-1 font-bold">
              <AlertTriangle className="h-3 w-3" /> Excludes pending/unpaid orders
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="verify" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-14 w-full sm:w-auto">
            <TabsTrigger value="verify" className="rounded-xl px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm h-full">
              Payments verification
            </TabsTrigger>
            <TabsTrigger value="payouts" className="rounded-xl px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm h-full">
              Payouts Due
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={handleExportBank} variant="outline" className="rounded-2xl gap-2 font-black text-xs uppercase tracking-widest border-2 hover:bg-slate-50 w-full sm:w-auto h-12 shadow-sm">
            <Download className="h-4 w-4" /> Export Ledger
          </Button>
        </div>

        {/* VERIFICATION PANEL TAB */}
        <TabsContent value="verify" className="animate-in fade-in duration-700">
          <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="py-6 font-black uppercase text-[10px] tracking-widest text-slate-400 pl-8">Customer & Order ID</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Payment Channel</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">UTR / Reference</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Amount</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 w-72">Remarks & Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayments ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto" />
                        <p className="mt-4 text-slate-400 font-bold uppercase text-xs tracking-widest">Fetching collections...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBankPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center">
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No payments matching filter criteria.</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBankPayments.map((p) => {
                    const statusVal = p.paymentStatus || 'Pending Verification'
                    
                    return (
                      <TableRow key={p.id} className="border-slate-50 hover:bg-slate-50/50 transition-all group">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center font-black text-emerald-600 text-lg shadow-sm border border-emerald-100">
                              {p.buyerName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 leading-none">{p.buyerName || 'Customer'}</p>
                              <p className="text-[10px] text-slate-400 font-bold tracking-tighter mt-1.5 uppercase">Order: {p.orderNumber || p.orderId?.slice(0, 12)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center shadow-sm p-1.5">
                                {p.paymentMethod === 'upi' ? <Smartphone className="h-4 w-4 text-emerald-600" /> : <Building className="h-4 w-4 text-slate-400" />}
                             </div>
                             <span className="font-bold text-slate-700 text-sm uppercase">{p.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-bold text-slate-800">
                          {p.utrNumber ? p.utrNumber : <span className="text-slate-400 text-xs italic">N/A (COD)</span>}
                        </TableCell>
                        <TableCell>
                          <p className="font-black text-slate-900 text-base tracking-tight">₹{p.amount.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            statusVal === 'Verified' ? 'bg-emerald-100 text-emerald-800 font-bold border-none' :
                            statusVal === 'Pending Verification' ? 'bg-amber-100 text-amber-800 font-bold border-none animate-pulse' :
                            statusVal === 'Pending Payment' ? 'bg-orange-100 text-orange-800 font-bold border-none' :
                            statusVal === 'Rejected' ? 'bg-red-100 text-red-800 font-bold border-none' :
                            statusVal === 'Expired' ? 'bg-rose-100 text-rose-800 font-bold border-none' :
                            statusVal === 'COD Pending' ? 'bg-indigo-100 text-indigo-800 font-bold border-none' :
                            'bg-slate-100 text-slate-800 font-bold border-none'
                          }>
                            {statusVal}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8">
                          {statusVal === 'Pending Verification' ? (
                            <div className="space-y-2 py-2">
                              <Input 
                                placeholder="Add remarks..." 
                                value={remarksInputs[p.id] || ""}
                                onChange={(e) => setRemarksInputs({ ...remarksInputs, [p.id]: e.target.value })}
                                className="h-8 text-xs rounded-lg border-slate-200"
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleVerifyPayment(p.id, p.orderId, remarksInputs[p.id])}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-wider rounded-lg h-7"
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectPayment(p.id, p.orderId, remarksInputs[p.id])}
                                  className="flex-1 font-black uppercase text-[9px] tracking-wider rounded-lg h-7"
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 font-semibold space-y-1">
                              {p.remarks && <p className="italic">"{p.remarks}"</p>}
                              {p.verifiedBy && (
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">
                                  Checked by {p.verifiedBy}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYOUTS TAB */}
        <TabsContent value="payouts" className="animate-in fade-in duration-700">
          <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-100 rounded-[2rem] flex flex-col sm:flex-row items-center gap-4 shadow-sm">
             <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
               <Clock className="h-7 w-7 text-white" />
             </div>
             <div className="space-y-1 text-center sm:text-left">
               <p className="text-lg font-black text-amber-900 uppercase tracking-tight">Payout Policy: 5-7 Working Days</p>
               <p className="text-sm text-amber-700 font-medium max-w-2xl">To ensure buyer protection, payments are released 5 days after delivery. Sellers are paid on a first-come, first-serve basis.</p>
             </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {payoutsDue.map((order, i) => (
                <Card key={i} className={`rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden group ${order.isReady ? 'border-emerald-100 bg-white hover:shadow-2xl' : 'border-slate-50 bg-slate-50/50 opacity-80'}`}>
                   <div className="p-6 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${order.isReady ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {order.isReady ? <FileCheck className="h-6 w-6 stroke-[3px]" /> : <Clock className="h-6 w-6" />}
                        </div>
                        <Badge variant="outline" className={`rounded-full px-4 py-1 font-black uppercase text-[10px] tracking-widest ${order.isReady ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                           {order.isReady ? 'Ready to Release' : `On Hold (${5 - order.daysSinceDelivery}d left)`}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Business Entity</p>
                        <p className="text-xl font-black text-slate-900 truncate">{order.items[0]?.sellerName || "Marketplace Partner"}</p>
                      </div>

                      <div className="flex justify-between items-end bg-slate-50 rounded-3xl p-5 border border-slate-100">
                         <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payout Net</p>
                           <p className={`text-2xl font-black ${order.isReady ? 'text-emerald-600' : 'text-slate-400'}`}>₹{order.sellerPayout.toLocaleString()}</p>
                         </div>
                         <Button 
                           size="lg" 
                           disabled={!order.isReady}
                           onClick={() => handlePayNow(order.items[0]?.sellerName || "Seller", order.sellerPayout)}
                           className={`rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 shadow-lg ${order.isReady ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-slate-300'}`}
                         >
                           Release Fund
                         </Button>
                      </div>
                   </div>
                   <div className="px-6 py-4 bg-slate-900 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Order: {order.orderNumber}</span>
                      <span className="text-slate-500">Service Fee: ₹{order.platformFee}</span>
                   </div>
                </Card>
             ))}

             {payoutsDue.length === 0 && (
                <div className="col-span-full py-32 text-center space-y-4">
                  <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-slate-200 text-slate-300">
                    <Clock className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Pending Payouts Found</p>
                    <p className="text-slate-300 text-xs font-medium italic">Sellers appear here once orders are marked delivered.</p>
                  </div>
                </div>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
