'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { approveDeposit, rejectDeposit, subscribeToPendingDeposits } from '@/lib/walletService'

function formatDate(timestamp) {
  if (!timestamp) return 'Not available'
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminDeposits() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [reasons, setReasons] = useState({})

  useEffect(() => {
    const unsubscribe = subscribeToPendingDeposits(
      (items) => {
        setPartners(items)
        setLoading(false)
      },
      (error) => {
        console.error(error)
        setLoading(false)
        toast.error('Could not load deposit requests')
      },
    )

    return unsubscribe
  }, [])

  const handleApprove = async (uid) => {
    setBusyId(uid)
    try {
      await approveDeposit(uid)
      toast.success('Deposit approved')
    } catch (error) {
      console.error(error)
      toast.error('Could not approve deposit')
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (uid) => {
    setBusyId(uid)
    try {
      await rejectDeposit(uid, reasons[uid])
      toast.success('Deposit rejected')
    } catch (error) {
      console.error(error)
      toast.error('Could not reject deposit')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Admin Wallet Operations</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Deposit Verification</h1>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="space-y-3 p-4 sm:p-6">
          {loading ? (
            <>
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </>
          ) : partners.length ? (
            partners.map((partner) => (
              <div key={partner.id} className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-950">{partner.name || partner.displayName || 'Delivery Partner'}</p>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-500">{partner.phone || 'No phone'}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Amount Rs {Number(partner.wallet?.depositAmount || 500).toLocaleString('en-IN')} · Requested {formatDate(partner.wallet?.depositRequestedAt)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] lg:w-[520px]">
                  <Input
                    value={reasons[partner.id] || ''}
                    onChange={(event) => setReasons((current) => ({ ...current, [partner.id]: event.target.value }))}
                    placeholder="Reason for rejection"
                    className="h-11 rounded-xl"
                  />
                  <Button onClick={() => handleApprove(partner.id)} disabled={busyId === partner.id} className="h-11 rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700">
                    {busyId === partner.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => handleReject(partner.id)} disabled={busyId === partner.id} className="h-11 rounded-xl font-black text-red-600 hover:text-red-700">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-black uppercase tracking-widest text-slate-400">No pending deposits</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
