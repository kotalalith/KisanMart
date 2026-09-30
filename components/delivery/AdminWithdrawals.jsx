'use client'

import { useEffect, useState } from 'react'
import { BadgeIndianRupee, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { approveWithdrawal, rejectWithdrawal, subscribeToPendingWithdrawals } from '@/lib/walletService'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

function formatDate(timestamp) {
  if (!timestamp) return 'Not available'
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [reasons, setReasons] = useState({})

  // Partner Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [loadingPartner, setLoadingPartner] = useState(false)

  const handleViewDetails = async (uid) => {
    setLoadingPartner(true)
    setIsDetailsOpen(true)
    try {
      const snap = await getDoc(doc(db, 'delivery_partners', uid))
      if (snap.exists()) {
        setSelectedPartner(snap.data())
      } else {
        toast.error("Partner not found")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load partner details")
    } finally {
      setLoadingPartner(false)
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToPendingWithdrawals(
      (items) => {
        setRequests(items)
        setLoading(false)
      },
      (error) => {
        console.error(error)
        setLoading(false)
        toast.error('Could not load withdrawal requests')
      },
    )

    return unsubscribe
  }, [])

  const handleApprove = async (request) => {
    setBusyId(request.id)
    try {
      await approveWithdrawal(request)
      toast.success('Withdrawal marked as paid')
    } catch (error) {
      console.error(error)
      toast.error('Could not approve withdrawal')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (request) => {
    setBusyId(request.id)
    try {
      await rejectWithdrawal(request, reasons[request.id])
      toast.success('Withdrawal rejected')
    } catch (error) {
      console.error(error)
      toast.error('Could not reject withdrawal')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Admin Wallet Operations</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Withdrawal Approval</h1>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="space-y-3 p-4 sm:p-6">
          {loading ? (
            <>
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </>
          ) : requests.length ? (
            requests.map((request) => (
              <div key={request.id} className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <BadgeIndianRupee className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-950">{request.displayName || 'Delivery Partner'}</p>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                      <Button variant="link" onClick={() => handleViewDetails(request.uid)} className="h-6 px-2 text-[10px] font-black uppercase text-blue-600">
                        View Details
                      </Button>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-500">{request.upiId} · {request.phone || 'No phone'}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Amount Rs {Number(request.amount || 0).toLocaleString('en-IN')} · Requested {formatDate(request.requestedAt)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] lg:w-[540px]">
                  <Input
                    value={reasons[request.id] || ''}
                    onChange={(event) => setReasons((current) => ({ ...current, [request.id]: event.target.value }))}
                    placeholder="Reason for rejection"
                    className="h-11 rounded-xl"
                  />
                  <Button onClick={() => handleApprove(request)} disabled={busyId === request.id} className="h-11 rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700">
                    {busyId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Mark as Paid
                  </Button>
                  <Button variant="outline" onClick={() => handleReject(request)} disabled={busyId === request.id} className="h-11 rounded-xl font-black text-red-600 hover:text-red-700">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <BadgeIndianRupee className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-black uppercase tracking-widest text-slate-400">No pending withdrawals</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Partner Details</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Review wallet balance and profile
            </DialogDescription>
          </DialogHeader>

          {loadingPartner ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : selectedPartner ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <img src={selectedPartner.selfieUrl || "https://ui-avatars.com/api/?name=Partner"} alt="Partner" className="h-16 w-16 rounded-2xl object-cover border-4 border-slate-100" />
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedPartner.name || 'Unnamed Partner'}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedPartner.deliveryId || 'Pending ID'}</p>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Balance</span>
                  <span className="text-lg font-black text-emerald-600">Rs {selectedPartner.wallet?.balance || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Earned</span>
                  <span className="text-sm font-black text-slate-900">Rs {selectedPartner.wallet?.totalEarned || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Duty Status</span>
                  <Badge className={selectedPartner.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}>
                    {selectedPartner.status === 'active' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Info</p>
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span>Phone:</span>
                  <span>{selectedPartner.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span>Vehicle:</span>
                  <span className="uppercase">{selectedPartner.vehicleNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm font-bold text-red-500 py-8">Partner details not found.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
