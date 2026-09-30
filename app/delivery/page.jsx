'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrders } from '@/lib/order-context'
import { useUser } from '@/lib/user-context'
import { NotificationCenterDrawer } from '@/components/notification-center-drawer'
import { AnnouncementBanner } from '@/components/announcements/announcement-banner'
import { AnnouncementPopup } from '@/components/announcements/announcement-popup'
import WalletDashboard from '@/components/delivery/WalletDashboard'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Wallet, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  TrendingUp, 
  Bell, 
  User, 
  FileText, 
  Camera, 
  Smartphone, 
  ShieldCheck, 
  Eye,
  AlertCircle
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import DeliveryProtectedRoute from '@/components/delivery/DeliveryProtectedRoute'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'

export default function DeliveryDashboard() {
  return (
    <DeliveryProtectedRoute>
      {({ uid, wallet }) => <DeliveryDashboardContent uid={uid} wallet={wallet} />}
    </DeliveryProtectedRoute>
  )
}

function DeliveryDashboardContent({ uid, wallet }) {
  const router = useRouter()
  const { orders, updateOrderStatus, getOrdersByDeliveryBoy } = useOrders()
  const { userProfile, updateProfile, switchIdentity, loading } = useUser()
  const [currentView, setCurrentView] = useState('dashboard')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [addingMoney, setAddingMoney] = useState(false)

  // Route Protection: Redirect to login if not authenticated or profile not found
  useEffect(() => {
    if (!loading && !userProfile) {
      // Clear invalid session and redirect
      localStorage.removeItem('agro_test_uid')
      window.location.href = '/delivery/login'
    }
  }, [userProfile, loading, router])


   // Profile Form States
   const [profileForm, setProfileForm] = useState({
      name: userProfile?.name || '',
      phone: userProfile?.phone || ''
   })

   // Sync form with profile data
   useEffect(() => {
      if (userProfile) {
         setProfileForm({
            name: userProfile.name || '',
            phone: userProfile.phone || ''
         })
      }
   }, [userProfile])

   const kycStatus = userProfile?.kycStatus || 'pending'
   const walletBalance = wallet?.balance || 0
   const hasInsufficientBalance = !wallet?.isActivated || walletBalance < 500
   const isOnline = userProfile?.status === 'active'

   const toggleStatus = async () => {
      if (!isOnline && hasInsufficientBalance) {
         toast.error("Please add money to your wallet to go online and receive orders.")
         return
      }
      const newStatus = isOnline ? 'inactive' : 'active'
      await updateProfile({ status: newStatus })
      toast.success(`You are now ${newStatus === 'active' ? 'Online' : 'Offline'}`)
   }

   // Top-up states
   const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)
   const [topupAmount, setTopupAmount] = useState(500)
   const [paymentStep, setPaymentStep] = useState('amount') // 'amount' | 'confirm'

   const handleOpenTopup = () => {
      setTopupAmount(500)
      setPaymentStep('amount')
      setIsAddMoneyOpen(true)
   }

   const handleProceedToPay = async () => {
      if (topupAmount < 500) return toast.error("Minimum amount is ₹500")
      
      const { getUpiPaymentLink } = await import('@/lib/walletService')
      const upiLink = getUpiPaymentLink(topupAmount)
      window.open(upiLink, '_blank')
      
      setPaymentStep('confirm')
   }

   const handleConfirmPayment = async () => {
      setAddingMoney(true)
      try {
         const { addMoneyToWallet } = await import('@/lib/walletService')
         await addMoneyToWallet(uid, topupAmount)
         toast.success(`₹${topupAmount} added to your wallet successfully!`)
         setIsAddMoneyOpen(false)
      } catch (err) {
         console.error(err)
         toast.error("Failed to confirm payment.")
      } finally {
         setAddingMoney(false)
      }
   }

   const myTasks = useMemo(() => {
      // Only show tasks if approved
      if (kycStatus !== 'approved' || !userProfile?.id) return []
      return getOrdersByDeliveryBoy(userProfile.id)
   }, [orders, userProfile?.id, getOrdersByDeliveryBoy, kycStatus])

   const stats = useMemo(() => {
      const completed = myTasks.filter(t => t.orderStatus === 'delivered').length
      const pending = myTasks.filter(t => t.orderStatus !== 'delivered').length
      return { completed, pending, earnings: walletBalance, total: walletBalance + 500 } // Example total
   }, [myTasks, walletBalance])

  // Loading State
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Partner Profile...</p>
      </div>
    )
  }

  // Final fallback if profile missing
  if (!userProfile) {
    return null
  }

   const handleFileUpload = async (e, field) => {
      const file = e.target.files[0]
      if (!file) return

      const toastId = toast.loading("Uploading document...")
      try {
         const formData = new FormData()
         formData.append('file', file)
         formData.append('folder', 'delivery-kyc')

         const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
         })

         const data = await res.json()
         if (data.url) {
            // Update Firestore and reset KYC status to pending for review
            await updateProfile({
               [field]: data.url,
               kycStatus: 'pending'
            })
            toast.success("Document uploaded for verification!", { id: toastId })
         } else {
            throw new Error("Upload failed")
         }
      } catch (error) {
         console.error(error)
         toast.error("Upload failed. Please try again.", { id: toastId })
      }
   }


   return (
      <div className="flex h-screen bg-slate-50/50 font-sans text-slate-900">
         {/* SaaS Sidebar */}
         <aside className="w-64 border-r bg-white flex flex-col hidden md:flex">
            <div className="p-6 border-b">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                     <Truck className="h-6 w-6" />
                  </div>
                  <div>
                     <span className="text-lg font-black tracking-tighter">AgroLogistics</span>
                     <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Partner Pro</p>
                  </div>
               </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
               {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'earnings', label: 'Earnings', icon: Wallet },
                  { id: 'profile', label: 'My Profile', icon: User },
                  { id: 'settings', label: 'Settings', icon: Settings },
               ].map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setCurrentView(item.id)}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === item.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                  >
                     <item.icon className="h-4 w-4" />
                     {item.label}
                  </button>
               ))}
            </nav>

            <div className="p-4 border-t">
               <div className={`p-4 rounded-2xl border transition-all ${isOnline ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-black uppercase text-slate-400">Duty Status</span>
                     <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  </div>
                  <p className="text-xs font-bold mb-3">
                    {kycStatus === 'approved' 
                      ? (isOnline ? 'Currently Online' : 'Currently Offline') 
                      : (kycStatus === 'rejected' ? 'KYC Rejected' : 'Verification Pending')}
                  </p>
                  <Button
                     onClick={toggleStatus}
                     disabled={kycStatus !== 'approved' || (!isOnline && hasInsufficientBalance)}
                     className={`w-full h-9 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${
                       isOnline 
                         ? 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50' 
                         : (kycStatus === 'approved' && !hasInsufficientBalance
                            ? 'bg-slate-900 text-white hover:bg-black' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                        }`}
                  >
                     {isOnline ? 'Go Offline' : (hasInsufficientBalance ? 'Low Balance' : 'Go Online')}
                  </Button>
               </div>
            </div>

            <div className="p-6 border-t flex items-center gap-3">
               <Avatar className="h-10 w-10 border-2 border-slate-100">
                  <AvatarImage src={userProfile?.selfieUrl} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-black">{userProfile?.name?.charAt(0) || 'D'}</AvatarFallback>
               </Avatar>
               <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black truncate">{userProfile?.name || 'Partner'}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{userProfile?.deliveryId || 'DL-PENDING'}</p>
               </div>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => {
              // Redirect to delivery login on logout
              window.location.href = '/delivery/login'
           }}>
              <LogOut className="h-4 w-4" />
           </Button>
            </div>
         </aside>

         {/* Main Content */}
         <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            <AnnouncementBanner role="delivery" />
            <AnnouncementPopup role="delivery" />
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                     {currentView === 'dashboard' ? 'Overview' : currentView.toUpperCase()}
                  </h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                     {isOnline ? '🟢 Available for new deliveries' : '⚪ You are currently offline'}
                  </p>
               </div>
               <div className="flex items-center gap-3">
                  <NotificationCenterDrawer />
                  <Button className="h-10 rounded-xl bg-slate-900 text-white font-black text-[10px] tracking-widest uppercase px-6">
                     Support
                  </Button>
               </div>
            </header>

            {/* Wallet Activation Banner */}
            {hasInsufficientBalance && (
               <div className="mb-8 p-6 rounded-[2rem] border-2 bg-rose-50 border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                     <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-rose-100 text-rose-600">
                        <Wallet className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="font-black tracking-tight text-rose-900">
                           Wallet Top-Up Required
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-widest mt-1 text-rose-700">
                           Your wallet balance is low (₹{walletBalance}). Maintain a minimum balance of ₹500 to receive orders.
                        </p>
                     </div>
                  </div>
                  <Button
                     className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-black text-[10px] tracking-widest uppercase px-6 h-12 shadow-lg shadow-rose-100 min-w-[150px]"
                     onClick={handleOpenTopup}
                  >
                     Add Money via UPI
                  </Button>
               </div>
            )}

            {/* Top-up Modal */}
            <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
               <DialogContent className="max-w-md rounded-[2.5rem] p-8">
                  <DialogHeader>
                     <DialogTitle className="text-2xl font-black tracking-tight">Top Up Wallet</DialogTitle>
                     <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {paymentStep === 'amount' ? 'Enter amount to add via UPI' : 'Confirm your payment'}
                     </DialogDescription>
                  </DialogHeader>

                  {paymentStep === 'amount' ? (
                     <div className="space-y-6 py-4">
                        <div className="space-y-3">
                           <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Amount to Add (Min ₹500)</Label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                              <Input 
                                 type="number"
                                 min="500"
                                 value={topupAmount} 
                                 onChange={e => setTopupAmount(Number(e.target.value))}
                                 className="h-14 rounded-xl bg-slate-50 border-slate-100 font-black text-lg pl-8"
                              />
                           </div>
                        </div>
                        <Button 
                           onClick={handleProceedToPay}
                           className="w-full h-14 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl shadow-slate-200"
                        >
                           Proceed to Pay via UPI
                        </Button>
                     </div>
                  ) : (
                     <div className="space-y-6 py-4">
                        <div className="rounded-2xl bg-amber-50 p-6 text-center border-2 border-amber-100">
                           <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2">Pending Confirmation</p>
                           <p className="text-sm font-bold text-amber-900">
                              Please complete the payment of <strong className="font-black text-lg">₹{topupAmount}</strong> in your UPI app.
                           </p>
                           <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-4">
                              Once completed, click the button below to credit your wallet.
                           </p>
                        </div>
                        
                        <div className="flex gap-3">
                           <Button 
                              variant="outline"
                              onClick={() => setPaymentStep('amount')}
                              disabled={addingMoney}
                              className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest"
                           >
                              Cancel
                           </Button>
                           <Button 
                              onClick={handleConfirmPayment}
                              disabled={addingMoney}
                              className="flex-[2] h-14 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700"
                           >
                              {addingMoney ? "Verifying..." : "I Have Paid"}
                           </Button>
                        </div>
                     </div>
                  )}
               </DialogContent>
            </Dialog>

            {/* KYC Banner */}
            {kycStatus !== 'approved' && (
               <div className={`mb-8 p-6 rounded-[2rem] border-2 flex flex-col md:flex-row items-center justify-between gap-6 ${kycStatus === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                  }`}>
                  <div className="flex items-center gap-6">
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${kycStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600 animate-pulse'
                        }`}>
                        {kycStatus === 'rejected' ? <AlertCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                     </div>
                     <div>
                        <h3 className={`font-black tracking-tight ${kycStatus === 'rejected' ? 'text-red-900' : 'text-amber-900'}`}>
                           KYC Verification {kycStatus === 'rejected' ? 'Rejected' : 'Pending'}
                        </h3>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${kycStatus === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}>
                           {kycStatus === 'rejected' ? 'Your documents were not clear. Please re-upload to continue.' : 'Reviewing your documents. Orders will be assigned once approved.'}
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     {kycStatus === 'rejected' ? (
                        <Button
                           className="rounded-xl bg-red-600 text-white hover:bg-red-700 font-black text-[10px] tracking-widest uppercase px-6 h-12 shadow-lg shadow-red-100"
                           onClick={() => setCurrentView('profile')}
                        >
                           Re-upload Now
                        </Button>
                     ) : (
                        <Button
                           variant="outline"
                           className="rounded-xl font-black text-[10px] tracking-widest uppercase border-2 border-amber-200 text-amber-600 hover:bg-amber-50 h-12 px-6"
                           onClick={() => setCurrentView('profile')}
                        >
                           Check Status
                        </Button>
                     )}
                  </div>
               </div>
            )}


            {currentView === 'dashboard' && (
               <div className="space-y-8">
                  {/* SaaS Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     {[
                        { label: 'Pending Tasks', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: "Today's Earnings", value: `₹${stats.earnings}`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Wallet Balance', value: `₹${stats.total}`, icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-50' },
                     ].map((s, idx) => (
                        <Card key={idx} className="border-none shadow-sm shadow-slate-200/50 rounded-3xl p-4 flex items-center gap-4">
                           <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
                              <s.icon className="h-6 w-6" />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                              <p className="text-xl font-black tracking-tight">{s.value}</p>
                           </div>
                        </Card>
                     ))}
                  </div>

                  {/* Tasks Section */}
                  <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                     <CardHeader className="p-8 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                              <CardTitle className="text-xl font-black tracking-tight">Active Deliveries</CardTitle>
                              <CardDescription className="text-xs font-bold uppercase text-slate-400 tracking-widest mt-1">Manage your current tasks and status</CardDescription>
                           </div>
                           <div className="flex items-center gap-2">
                              <Button variant="ghost" className="h-10 rounded-xl px-4 text-xs font-black uppercase text-slate-400 tracking-widest hover:text-slate-600">History</Button>
                              <Button className="h-10 rounded-xl bg-slate-100 text-slate-900 font-black text-[10px] tracking-widest uppercase px-6">Refresh</Button>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="p-8 pt-4">
                        {myTasks.length === 0 ? (
                           <div className="py-20 text-center space-y-4">
                              <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                                 <Package className="h-8 w-8" />
                              </div>
                              <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No active tasks assigned</p>
                           </div>
                        ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {myTasks.map((task) => (
                                 <div key={task.id} className="p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-emerald-200 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 h-2 w-24 bg-emerald-500/10 rounded-bl-3xl"></div>
                                    <div className="flex justify-between items-start mb-4">
                                       <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[8px] uppercase px-2 py-0.5 tracking-widest">
                                          {task.orderNumber}
                                       </Badge>
                                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                          {task.orderStatus.replace('_', ' ')}
                                       </span>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                       <div className="flex items-center gap-3">
                                          <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                             <User className="h-4 w-4" />
                                          </div>
                                          <div>
                                             <p className="text-xs font-black">{task.buyerName}</p>
                                             <p className="text-[10px] font-bold text-slate-400">{task.buyerPhone}</p>
                                          </div>
                                       </div>
                                       <div className="flex items-start gap-3">
                                          <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                                             <MapPin className="h-4 w-4" />
                                          </div>
                                          <p className="text-xs font-bold text-slate-600 leading-relaxed">{task.address}</p>
                                       </div>
                                    </div>

                                    <div className="flex gap-3">
                                       {task.orderStatus === 'assigned' && (
                                          <Button
                                             className="flex-1 h-12 rounded-2xl bg-slate-900 text-white hover:bg-black font-black uppercase text-[10px] tracking-widest"
                                             onClick={() => updateOrderStatus(task.id, 'picked_up')}
                                          >
                                             Confirm Pickup
                                          </Button>
                                       )}
                                       {task.orderStatus === 'picked_up' && (
                                          <Button
                                             className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100"
                                             onClick={() => updateOrderStatus(task.id, 'delivered')}
                                          >
                                             Mark Delivered
                                          </Button>
                                       )}
                                       <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-100 text-slate-400 hover:text-emerald-600" onClick={() => window.open(`tel:${task.buyerPhone}`)}>
                                          <Phone className="h-4 w-4" />
                                       </Button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>
            )}

            {currentView === 'earnings' && (
               <div className="animate-in fade-in duration-500">
                  <WalletDashboard uid={uid} wallet={wallet} />
               </div>
            )}

            {currentView === 'profile' && (
               <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <Card className="md:col-span-1 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 text-center">
                        <div className="relative inline-block mb-6">
                           <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                              <AvatarImage src={userProfile?.selfieUrl} />
                              <AvatarFallback className="text-3xl font-black bg-emerald-50 text-emerald-600">{userProfile?.name?.charAt(0) || 'D'}</AvatarFallback>
                           </Avatar>
                           {kycStatus === 'approved' && (
                              <div className="absolute bottom-1 right-1 h-8 w-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white">
                                 <ShieldCheck className="h-4 w-4" />
                              </div>
                           )}
                        </div>
                        <h2 className="text-xl font-black tracking-tight">{userProfile?.name || 'Delivery Partner'}</h2>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1">{userProfile?.deliveryId || 'DL-PENDING'}</p>
                        <div className="mt-8 pt-8 border-t space-y-4">
                           <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                              <span>Rating</span>
                              <span className="text-slate-900 flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {userProfile?.rating ? Number(userProfile.rating).toFixed(1) : '0.0'}</span>
                           </div>

                           <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                              <span>Member Since</span>
                              <span className="text-slate-900">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'May 2024'}</span>
                           </div>
                        </div>
                     </Card>

                     <div className="md:col-span-2 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Account Details</h4>
                              <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                                 <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 rounded-lg font-black text-[8px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50">
                                       Edit Details
                                    </Button>
                                 </DialogTrigger>
                                 <DialogContent className="max-w-md rounded-[2.5rem] p-8">
                                    <DialogHeader>
                                       <DialogTitle className="text-2xl font-black tracking-tight">Edit Profile</DialogTitle>
                                       <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update your personal information</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                       <div className="space-y-2">
                                          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</Label>
                                          <Input 
                                            value={profileForm.name} 
                                            onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
                                          />
                                       </div>
                                       <div className="space-y-2">
                                          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Phone Number</Label>
                                          <Input 
                                            value={profileForm.phone} 
                                            onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
                                          />
                                       </div>
                                    </div>
                                    <DialogFooter>
                                       <Button 
                                         onClick={async () => {
                                           await updateProfile(profileForm)
                                           setIsProfileModalOpen(false)
                                           toast.success("Profile updated!")
                                         }}
                                         className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest"
                                       >
                                          Save Changes
                                       </Button>
                                    </DialogFooter>
                                 </DialogContent>
                              </Dialog>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Phone Number</p>
                                 <p className="font-bold text-slate-700">{userProfile?.phone || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email Address</p>
                                 <p className="font-bold text-slate-700">{userProfile?.email || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vehicle Assigned</p>
                                 <p className="font-bold text-slate-700 uppercase">{userProfile?.vehicleType || 'Not Assigned'}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Plate Number</p>
                                 <p className="font-bold text-emerald-600 uppercase tracking-tighter">{userProfile?.vehicleNumber || 'PENDING'}</p>
                              </div>
                           </div>
                        </Card>

                        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Verified Documents</h4>
                           <div className="space-y-4">
                              {[
                                 { name: 'Driving License', field: 'license', url: userProfile?.licenseUrl, icon: FileText },
                                 { name: 'Vehicle RC Book', field: 'rc', url: userProfile?.rcUrl, icon: Truck },
                                 { name: 'Identity Selfie', field: 'selfie', url: userProfile?.selfieUrl, icon: Camera },
                              ].map((doc, i) => {
                                 const docStatus = userProfile?.[`${doc.field}Status`]
                                 const isApproved = docStatus === 'approved'
                                 const isRejected = docStatus === 'rejected'

                                 return (
                                    <div key={i} className="relative group">
                                       <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                          isApproved ? 'bg-emerald-50/30 border-emerald-100' : 
                                          isRejected ? 'bg-red-50/30 border-red-100' : 'bg-white border-slate-50'
                                       }`}>
                                          <div className="flex items-center gap-3">
                                             <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                                isApproved ? 'bg-emerald-100 text-emerald-600' : 
                                                isRejected ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'
                                             }`}>
                                                <doc.icon className="h-5 w-5" />
                                             </div>
                                             <div>
                                                <span className="font-black text-xs text-slate-700 uppercase tracking-tight">{doc.name}</span>
                                                {docStatus && (
                                                   <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${
                                                      isApproved ? 'text-emerald-600' : 'text-red-600'
                                                   }`}>
                                                      {docStatus}
                                                   </p>
                                                )}
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                             {doc.url && (
                                                <Dialog>
                                                   <DialogTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                                                         <Eye className="h-4 w-4" />
                                                      </Button>
                                                   </DialogTrigger>
                                                   <DialogContent className="max-w-2xl rounded-[3rem] p-4 border-none shadow-2xl">
                                                      <DialogHeader className="hidden">
                                                         <DialogTitle>Document Preview</DialogTitle>
                                                         <DialogDescription>Viewing uploaded {doc.name}</DialogDescription>
                                                      </DialogHeader>
                                                      <div className="h-[500px] w-full rounded-2xl overflow-hidden bg-slate-100 mt-4">
                                                         <img src={doc.url} className="w-full h-full object-contain" alt={doc.name} />
                                                      </div>
                                                   </DialogContent>
                                                </Dialog>
                                             )}
                                             
                                             {!isApproved && (
                                                <div className="relative">
                                                   <Button 
                                                      variant="ghost" 
                                                      size="sm" 
                                                      className={`h-8 px-3 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${
                                                         isRejected ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                                                      }`}
                                                   >
                                                      {doc.url ? 'Replace' : 'Upload'}
                                                   </Button>
                                                   <input
                                                      type="file"
                                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                                      onChange={e => handleFileUpload(e, `${doc.field}Url`)}
                                                   />
                                                </div>
                                             )}
                                             {isApproved && (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-2" />
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 )
                              })}

                           </div>
                        </Card>
                     </div>
                  </div>
               </div>
            )}
         </main>
      </div>
   )
}
