'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, History, Lock, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SECURITY_DEPOSIT_AMOUNT, subscribeToRecentTransactions, addMoneyToWallet, getUpiPaymentLink } from '@/lib/walletService'

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`
}

function getTimestampDate(timestamp) {
  if (!timestamp) return null
  if (typeof timestamp.toDate === 'function') return timestamp.toDate()
  return new Date(timestamp)
}

function TransactionRow({ transaction }) {
  const isWithdrawal = transaction.type === 'withdrawal'
  const date = getTimestampDate(transaction.timestamp)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isWithdrawal ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
        {isWithdrawal ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">{transaction.description}</p>
        <p className="text-xs font-bold text-slate-400">{date ? date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-black ${isWithdrawal ? 'text-red-600' : 'text-emerald-600'}`}>
          {isWithdrawal ? '-' : '+'}{money(transaction.amount)}
        </p>
        <Badge className="mt-1 bg-slate-100 text-slate-600 hover:bg-slate-100">{transaction.status || 'completed'}</Badge>
      </div>
    </div>
  )
}

export default function WalletDashboard({ uid, wallet }) {
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  
  // Top-up states
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false)
  const [topupAmount, setTopupAmount] = useState(500)
  const [paymentStep, setPaymentStep] = useState('amount') // 'amount' | 'confirm'
  const [addingMoney, setAddingMoney] = useState(false)

  const handleOpenTopup = () => {
    setTopupAmount(500)
    setPaymentStep('amount')
    setIsAddMoneyOpen(true)
  }

  const handleProceedToPay = () => {
    if (topupAmount < 500) return toast.error("Minimum amount is ₹500")
    
    // Open UPI link
    const upiLink = getUpiPaymentLink(topupAmount)
    window.open(upiLink, '_blank')
    
    // Switch to confirm step
    setPaymentStep('confirm')
  }

  const handleConfirmPayment = async () => {
    setAddingMoney(true)
    try {
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

  useEffect(() => {
    const unsubscribe = subscribeToRecentTransactions(
      uid,
      (items) => {
        setTransactions(items)
        setLoadingTransactions(false)
      },
      5,
      (error) => {
        console.error(error)
        setLoadingTransactions(false)
        toast.error('Could not load recent transactions')
      },
    )

    return unsubscribe
  }, [uid])

  const weekEarnings = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return transactions
      .filter((item) => item.type === 'credit')
      .filter((item) => {
        const date = getTimestampDate(item.timestamp)
        return date && date >= startOfWeek
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [transactions])

  const stats = [
    { label: 'Current Balance', value: money(wallet.balance), icon: Wallet, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'This Week Earnings', value: money(weekEarnings), icon: ArrowUpRight, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Security Deposit (Locked)', value: money(SECURITY_DEPOSIT_AMOUNT), icon: Lock, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Total Earned (Lifetime)', value: money(wallet.totalEarned), icon: History, tone: 'bg-slate-100 text-slate-700' },
  ]

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Delivery Partner Wallet</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Wallet Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleOpenTopup} className="h-11 rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Add Money
            </Button>
            <Button variant="outline" onClick={() => router.push('/delivery/wallet/history')} className="h-11 rounded-xl font-black">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            <Button onClick={() => router.push('/delivery/wallet/withdraw')} className="h-11 rounded-xl bg-slate-950 font-black text-white hover:bg-slate-800">
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm">
              <CardContent className="p-5">
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black">Recent Transactions</CardTitle>
            <Button variant="ghost" onClick={() => router.push('/delivery/wallet/history')} className="text-xs font-black uppercase tracking-widest">
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingTransactions ? (
              <>
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </>
            ) : transactions.length ? (
              transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                <Wallet className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-black uppercase tracking-widest text-slate-400">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}
