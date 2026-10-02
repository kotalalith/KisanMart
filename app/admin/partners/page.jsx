'use client'

import { useState, useMemo } from 'react'
import { useAdminUsers } from '@/lib/admin-users-context'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Truck, 
  CheckCircle2, 
  Search, 
  Star,
  Mail,
  Phone,
  Wallet,
  ArrowRight,
  Ban,
  Unlock,
  Clock,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  History,
  AlertCircle,
  FileText,
  Camera,
  ChevronRight,
  MapPin,
  Check,
  Loader2,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { db } from '@/lib/firebase'
import { doc, updateDoc, increment } from 'firebase/firestore'

export default function AdminPartnersPage() {
  const { users, loading, updateKycStatus, updateUserStatus, updateDocStatus, addDeliveryPartner } = useAdminUsers()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isPayoutHistoryOpen, setIsPayoutHistoryOpen] = useState(false)
  const [newPartner, setNewPartner] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Mini Truck (TATA Ace)',
    vehicleNumber: '',
    city: 'Pune',
    licenseNumber: '',
    walletBalance: 0,
    kycStatus: 'approved',
    status: 'active'
  })

  const handleAddPartnerSubmit = async (e) => {
    e.preventDefault()
    if (!newPartner.name.trim()) {
      return toast.error("Please enter the partner's name")
    }
    if (!newPartner.phone.trim()) {
      return toast.error("Please enter a contact phone number")
    }

    setIsAdding(true)
    try {
      const generatedId = `AGRO-DL-${Math.floor(1000 + Math.random() * 9000)}`
      await addDeliveryPartner({
        ...newPartner,
        deliveryId: generatedId
      })
      toast.success(`Partner "${newPartner.name}" registered successfully (${generatedId})`)
      setIsAddPartnerOpen(false)
      setNewPartner({
        name: '',
        phone: '',
        email: '',
        vehicleType: 'Mini Truck (TATA Ace)',
        vehicleNumber: '',
        city: 'Pune',
        licenseNumber: '',
        walletBalance: 0,
        kycStatus: 'approved',
        status: 'active'
      })
    } catch (err) {
      toast.error("Failed to add partner")
    } finally {
      setIsAdding(false)
    }
  }

  const partners = useMemo(() => users.filter(u => u.role === 'delivery' || u.collection === 'delivery_partners'), [users])

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const searchStr = `${p.name} ${p.deliveryId} ${p.id}`.toLowerCase()
      const matchesSearch = searchStr.includes(searchQuery.toLowerCase())
      
      if (activeTab === 'all') return matchesSearch
      if (activeTab === 'pending') return matchesSearch && (p.kycStatus === 'pending' || !p.kycStatus)
      if (activeTab === 'active') return matchesSearch && p.kycStatus === 'approved' && p.status === 'active'
      if (activeTab === 'suspended') return matchesSearch && p.status === 'suspended'
      return matchesSearch
    })
  }, [partners, searchQuery, activeTab])

  const handleSettlePayout = async (partner) => {
    if (!partner.walletBalance || partner.walletBalance <= 0) {
      return toast.error("No pending balance to settle")
    }

    setIsProcessing(true)
    const toastId = toast.loading(`Processing payout for ${partner.name}...`)
    
    try {
      const partnerRef = doc(db, 'delivery_partners', partner.id)
      await updateDoc(partnerRef, {
        totalPaid: increment(partner.walletBalance),
        walletBalance: 0,
        lastPayoutDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      toast.success("Settlement successful", { id: toastId })
    } catch (error) {
      toast.error("Failed to process payout", { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateUserStatus(id, newStatus)
      toast.success(`Account ${newStatus} successfully`)
    } catch (e) {
      toast.error("Failed to update account status")
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Loading partner directory...</p>
       </div>
    </div>
  )

  return (
    <div className="max-w-[1600px] mx-auto p-8 space-y-8 bg-white min-h-screen text-slate-900 font-sans antialiased">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">Delivery Partners</h1>
           <p className="text-slate-500 mt-1">Monitor logistics performance, verify documents, and manage financial settlements.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Payout History Modal */}
          <Dialog open={isPayoutHistoryOpen} onOpenChange={setIsPayoutHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">
                <History className="h-4 w-4 mr-2" /> Payout History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="px-8 py-6 border-b bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900">Partner Settlements & Payout History</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Summary of payouts settled and pending liabilities across your logistics fleet.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Settled</span>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">
                      ₹{partners.reduce((acc, p) => acc + (p.totalPaid || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-indigo-50/40">
                    <span className="text-[10px] font-bold uppercase text-indigo-500">Pending Liability</span>
                    <div className="text-2xl font-bold text-indigo-600 mt-1">
                      ₹{partners.reduce((acc, p) => acc + (p.walletBalance || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Fleet Count</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {partners.length}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs uppercase font-semibold text-slate-600 pl-4">Partner Identity</TableHead>
                        <TableHead className="text-xs uppercase font-semibold text-slate-600 text-center">Already Settled</TableHead>
                        <TableHead className="text-xs uppercase font-semibold text-slate-600 text-center">Current Wallet</TableHead>
                        <TableHead className="text-xs uppercase font-semibold text-slate-600 text-right pr-4">Last Payout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">
                            No partners found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        partners.map(p => (
                          <TableRow key={p.id} className="hover:bg-slate-50/50">
                            <TableCell className="pl-4">
                              <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                              <div className="text-[11px] text-slate-400 uppercase font-mono">{p.deliveryId || p.id}</div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-emerald-600 text-sm">
                              ₹{(p.totalPaid || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-900 text-sm">
                              ₹{(p.walletBalance || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right pr-4 text-xs text-slate-500 font-medium">
                              {p.lastPayoutDate ? new Date(p.lastPayoutDate).toLocaleDateString() : 'Never'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add New Partner Modal */}
          <Dialog open={isAddPartnerOpen} onOpenChange={setIsAddPartnerOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
                <Truck className="h-4 w-4 mr-2" /> Add New Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
              <DialogHeader className="px-8 py-6 border-b bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900">Add New Delivery Partner</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Register a logistics driver to assign farm-to-consumer delivery orders.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleAddPartnerSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                    <Input 
                      placeholder="e.g. Rahul Sharma"
                      value={newPartner.name}
                      onChange={e => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                    <Input 
                      placeholder="e.g. +91 98765 43210"
                      value={newPartner.phone}
                      onChange={e => setNewPartner(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                    <Input 
                      type="email"
                      placeholder="e.g. rahul.delivery@kisanmart.com"
                      value={newPartner.email}
                      onChange={e => setNewPartner(prev => ({ ...prev, email: e.target.value }))}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Operating City / Hub</Label>
                    <Input 
                      placeholder="e.g. Pune / Nashik"
                      value={newPartner.city}
                      onChange={e => setNewPartner(prev => ({ ...prev, city: e.target.value }))}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Vehicle Type</Label>
                    <Select 
                      value={newPartner.vehicleType} 
                      onValueChange={val => setNewPartner(prev => ({ ...prev, vehicleType: val }))}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mini Truck (TATA Ace)">Mini Truck (TATA Ace)</SelectItem>
                        <SelectItem value="Pickup Truck (Bolero)">Pickup Truck (Bolero)</SelectItem>
                        <SelectItem value="3-Wheeler Auto / Cargo">3-Wheeler Auto / Cargo</SelectItem>
                        <SelectItem value="Bike / Motorcycle">Bike / Motorcycle</SelectItem>
                        <SelectItem value="Electric Van / Rickshaw">Electric Van / Rickshaw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Vehicle Number</Label>
                    <Input 
                      placeholder="e.g. MH-12-AB-9876"
                      value={newPartner.vehicleNumber}
                      onChange={e => setNewPartner(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                      className="h-10 text-sm font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Driving License Number</Label>
                    <Input 
                      placeholder="e.g. DL-1420110012345"
                      value={newPartner.licenseNumber}
                      onChange={e => setNewPartner(prev => ({ ...prev, licenseNumber: e.target.value.toUpperCase() }))}
                      className="h-10 text-sm font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Initial Wallet Balance (₹)</Label>
                    <Input 
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newPartner.walletBalance}
                      onChange={e => setNewPartner(prev => ({ ...prev, walletBalance: Number(e.target.value) }))}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">KYC Status</Label>
                    <Select 
                      value={newPartner.kycStatus} 
                      onValueChange={val => setNewPartner(prev => ({ ...prev, kycStatus: val }))}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="KYC status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved (Pre-verified)</SelectItem>
                        <SelectItem value="pending">Pending Document Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Account Status</Label>
                    <Select 
                      value={newPartner.status} 
                      onValueChange={val => setNewPartner(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Account status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active (Ready for deliveries)</SelectItem>
                        <SelectItem value="suspended">Suspended / Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddPartnerOpen(false)}
                    className="border-slate-200 text-slate-600 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isAdding}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding Partner...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4 mr-2" /> Register Partner
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Total Fleet', value: partners.length, icon: Truck, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Verified Partners', value: partners.filter(p => p.status === 'active' && p.kycStatus === 'approved').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'KYC Reviews', value: partners.filter(p => p.kycStatus === 'pending' || !p.kycStatus).length, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { label: 'Payout Liability', value: `₹${partners.reduce((acc, p) => acc + (p.walletBalance || 0), 0).toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-xl border border-slate-100 ${stat.bg} space-y-2`}>
            <div className="flex items-center justify-between">
               <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
               <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <Tabs defaultValue="all" className="w-fit" onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100 p-1 rounded-lg h-10">
               <TabsTrigger value="all" className="text-xs font-semibold px-4 rounded-md">All Partners</TabsTrigger>
               <TabsTrigger value="pending" className="text-xs font-semibold px-4 rounded-md">Pending Review</TabsTrigger>
               <TabsTrigger value="active" className="text-xs font-semibold px-4 rounded-md">Verified</TabsTrigger>
               <TabsTrigger value="suspended" className="text-xs font-semibold px-4 rounded-md text-red-600">Blocked</TabsTrigger>
            </TabsList>
         </Tabs>
         <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
               placeholder="Search partners by name or ID..." 
               className="pl-10 h-10 border-slate-200 focus:ring-indigo-500 rounded-lg text-sm"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      {/* Partners Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider pl-6">Partner Identity</TableHead>
              <TableHead className="py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center">Wallet</TableHead>
              <TableHead className="py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center">Performance</TableHead>
              <TableHead className="py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center">KYC Status</TableHead>
              <TableHead className="py-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center">Status</TableHead>
              <TableHead className="w-16 pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.map((partner) => (
              <TableRow key={partner.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200">
                       <AvatarImage src={partner.selfieUrl} className="object-cover" />
                       <AvatarFallback className="bg-slate-50 text-slate-400 font-bold">{partner.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                       <span className="font-bold text-slate-900">{partner.name}</span>
                       <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{partner.deliveryId || 'ID-Pending'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-semibold text-slate-900 text-sm">₹{partner.walletBalance?.toLocaleString() || 0}</TableCell>
                <TableCell className="text-center">
                   <div className="flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-slate-700">{partner.rating ? Number(partner.rating).toFixed(1) : 'New'}</span>
                   </div>
                </TableCell>
                <TableCell className="text-center">
                   <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border shadow-none ${
                     partner.kycStatus === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 
                     partner.kycStatus === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                   }`}>
                      {partner.kycStatus || 'pending'}
                   </Badge>
                </TableCell>
                <TableCell className="text-center">
                   <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border-2 shadow-none ${
                     partner.status === 'active' ? 'border-indigo-100 bg-white text-indigo-600' : 'border-red-100 bg-white text-red-500'
                   }`}>
                      {partner.status || 'inactive'}
                   </Badge>
                </TableCell>
                <TableCell className="pr-6">
                   <Dialog>
                      <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                            <ChevronRight className="h-4 w-4" />
                         </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 border-none shadow-2xl rounded-xl overflow-hidden">
                         <DialogHeader className="px-8 py-6 border-b bg-white">
                            <div className="flex items-center gap-4">
                               <Avatar className="h-14 w-14 border-2 border-slate-100">
                                  <AvatarImage src={partner.selfieUrl} className="object-cover" />
                                  <AvatarFallback className="font-bold">{partner.name?.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="space-y-0.5">
                                  <DialogTitle className="text-xl font-bold">{partner.name}</DialogTitle>
                                  <DialogDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{partner.deliveryId || 'Pending Assignment'}</DialogDescription>
                               </div>
                            </div>
                         </DialogHeader>
                         
                         <Tabs defaultValue="profile" className="w-full">
                            <div className="bg-slate-50/50 px-8 border-b">
                               <TabsList className="h-12 bg-transparent gap-6">
                                  <TabsTrigger value="profile" className="h-full bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none px-0 text-sm font-semibold">Profile Overview</TabsTrigger>
                                  <TabsTrigger value="documents" className="h-full bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none px-0 text-sm font-semibold">KYC Verification</TabsTrigger>
                                  <TabsTrigger value="payouts" className="h-full bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-600 rounded-none px-0 text-sm font-semibold">Financials</TabsTrigger>
                               </TabsList>
                            </div>

                            <div className="p-8 bg-white min-h-[400px]">
                               <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in duration-300">
                                  <div className="grid grid-cols-3 gap-6">
                                     {[
                                        { label: 'Wallet Balance', value: `₹${partner.walletBalance || 0}`, icon: Wallet },
                                        { label: 'Total Earnings', value: `₹${(partner.walletBalance || 0) + (partner.totalPaid || 0)}`, icon: CreditCard },
                                        { label: 'Service Rating', value: partner.rating ? Number(partner.rating).toFixed(1) : 'NEW', icon: Star },
                                     ].map((item, i) => (
                                        <div key={i} className="p-6 rounded-xl border border-slate-100 bg-slate-50/30">
                                           <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">{item.label}</p>
                                           <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                                        </div>
                                     ))}
                                  </div>
                                  
                                  <div className="space-y-4">
                                     <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Operational Details</h3>
                                     <div className="grid grid-cols-2 gap-y-4 border rounded-xl p-6">
                                        <div className="flex flex-col">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</span>
                                           <span className="text-sm font-semibold">{partner.email}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                                           <span className="text-sm font-semibold">{partner.phone}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase">Onboarded Date</span>
                                           <span className="text-sm font-semibold">{partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Information</span>
                                           <span className="text-sm font-semibold">{partner.vehicleType || 'Not Set'}</span>
                                        </div>
                                     </div>
                                  </div>
                               </TabsContent>

                               <TabsContent value="documents" className="mt-0 space-y-6 animate-in fade-in duration-300">
                                  <div className="grid grid-cols-3 gap-6">
                                     {[
                                       { label: 'Driving License', field: 'license', url: partner.licenseUrl, icon: FileText },
                                       { label: 'Vehicle RC', field: 'rc', url: partner.rcUrl, icon: Truck },
                                       { label: 'Identity Selfie', field: 'selfie', url: partner.selfieUrl, icon: Camera }
                                     ].map((doc, idx) => {
                                       const docStatus = partner[`${doc.field}Status`] || 'pending'
                                       return (
                                          <div key={idx} className="flex flex-col border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                                             <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{doc.label}</span>
                                                <Badge variant="outline" className={`h-4.5 px-2 text-[8px] font-bold uppercase border-none ${docStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' : docStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                                   {docStatus}
                                                </Badge>
                                             </div>
                                             <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden relative group">
                                                {doc.url ? (
                                                  <>
                                                   <img src={doc.url} className="w-full h-full object-cover" />
                                                   <Dialog>
                                                      <DialogTrigger asChild>
                                                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                                                            <Button variant="secondary" size="sm" className="font-bold text-[10px] rounded-lg">View Full Image</Button>
                                                         </div>
                                                      </DialogTrigger>
                                                      <DialogContent className="max-w-4xl p-2 rounded-xl border-none">
                                                         <DialogHeader className="sr-only">
                                                            <DialogTitle>{doc.label} Preview</DialogTitle>
                                                            <DialogDescription>Visual inspection</DialogDescription>
                                                         </DialogHeader>
                                                         <img src={doc.url} className="w-full h-full rounded-lg" />
                                                      </DialogContent>
                                                   </Dialog>
                                                  </>
                                                ) : (
                                                  <div className="flex flex-col items-center opacity-20 text-slate-400">
                                                     <doc.icon className="h-6 w-6 mb-2" />
                                                     <span className="text-[10px] font-bold">No Document</span>
                                                  </div>
                                                )}
                                             </div>
                                             <div className="p-3 grid grid-cols-2 gap-2 bg-white">
                                                <Button 
                                                  variant="outline" 
                                                  size="sm"
                                                  disabled={!doc.url || docStatus === 'approved'}
                                                  className="h-9 text-[10px] font-bold uppercase border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all"
                                                  onClick={() => updateDocStatus(partner.id, doc.field, 'approved')}
                                                >
                                                   Approve
                                                </Button>
                                                <Button 
                                                  variant="outline" 
                                                  size="sm"
                                                  disabled={!doc.url || docStatus === 'rejected'}
                                                  className="h-9 text-[10px] font-bold uppercase border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                                                  onClick={() => updateDocStatus(partner.id, doc.field, 'rejected')}
                                                >
                                                   Reject
                                                </Button>
                                             </div>
                                          </div>
                                       )
                                     })}
                                  </div>
                               </TabsContent>

                               <TabsContent value="payouts" className="mt-0 space-y-6 animate-in fade-in duration-300">
                                  <div className="grid grid-cols-2 gap-8">
                                     <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6 shadow-xl">
                                        <div className="space-y-1">
                                           <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Available to Settle</span>
                                           <div className="text-4xl font-bold text-indigo-400">₹{partner.walletBalance || 0}</div>
                                        </div>
                                        <Button 
                                           disabled={isProcessing || !partner.walletBalance}
                                           className="w-full h-12 bg-white text-slate-900 hover:bg-indigo-50 font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg transition-all"
                                           onClick={() => handleSettlePayout(partner)}
                                        >
                                           {isProcessing ? 'Processing Transfer...' : 'Settle Wallet Now'}
                                        </Button>
                                        <p className="text-[10px] text-slate-500 font-medium text-center italic">Funds will be credited to the partner's verified payout account.</p>
                                     </div>

                                     <div className="border rounded-xl p-8 space-y-6 bg-white">
                                        <h4 className="text-[10px] font-bold uppercase text-slate-300 tracking-widest border-b pb-3">Financial History</h4>
                                        <div className="space-y-4">
                                           <div className="flex justify-between items-center text-xs font-semibold">
                                              <span className="text-slate-400">Total Earnings</span>
                                              <span className="text-slate-900">₹{(partner.walletBalance || 0) + (partner.totalPaid || 0)}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-xs font-semibold">
                                              <span className="text-slate-400">Already Paid</span>
                                              <span className="text-emerald-600">₹{partner.totalPaid || 0}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-xs font-semibold">
                                              <span className="text-slate-400">Last Payout</span>
                                              <span className="text-slate-900">{partner.lastPayoutDate ? new Date(partner.lastPayoutDate).toLocaleDateString() : 'Never'}</span>
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               </TabsContent>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-4 border-t bg-slate-50/50 flex items-center justify-end gap-3">
                               <DialogTrigger asChild>
                                  <Button variant="ghost" className="font-bold text-xs text-slate-500 px-6">Cancel</Button>
                               </DialogTrigger>
                               <Button 
                                  className="bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-8 rounded-lg shadow-lg"
                                  onClick={() => {
                                     updateKycStatus(partner.id, 'approved');
                                     toast.success("Identity verified successfully");
                                  }}
                                  disabled={partner.kycStatus === 'approved'}
                               >
                                  Finalize Verification
                               </Button>
                             </div>
                         </Tabs>
                      </DialogContent>
                   </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
