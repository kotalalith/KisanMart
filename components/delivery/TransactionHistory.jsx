'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Lock, ReceiptText } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { subscribeToTransactions } from '@/lib/walletService'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Credits' },
  { id: 'withdrawal', label: 'Withdrawals' },
  { id: 'deposit', label: 'Deposits' },
]

function formatDate(timestamp) {
  const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : timestamp ? new Date(timestamp) : new Date()
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusClass(status) {
  if (status === 'failed' || status === 'rejected') return 'bg-red-100 text-red-700 hover:bg-red-100'
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
  return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
}

function iconFor(type) {
  if (type === 'withdrawal') return { Icon: ArrowDownLeft, className: 'bg-red-50 text-red-600' }
  if (type === 'deposit') return { Icon: Lock, className: 'bg-blue-50 text-blue-600' }
  return { Icon: ArrowUpRight, className: 'bg-emerald-50 text-emerald-600' }
}

export default function TransactionHistory({ uid }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(10)

  useEffect(() => {
    const unsubscribe = subscribeToTransactions(
      uid,
      (items) => {
        setTransactions(items)
        setLoading(false)
      },
      (error) => {
        console.error(error)
        setLoading(false)
        toast.error('Could not load transaction history')
      },
    )

    return unsubscribe
  }, [uid])

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((item) => item.type === filter)
  }, [filter, transactions])

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Wallet Ledger</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Transaction History</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={filter === item.id ? 'default' : 'outline'}
              onClick={() => {
                setFilter(item.id)
                setVisibleCount(10)
              }}
              className={`h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest ${filter === item.id ? 'bg-slate-950 text-white' : ''}`}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="space-y-3 p-4 sm:p-6">
            {loading ? (
              <>
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </>
            ) : visible.length ? (
              visible.map((transaction) => {
                const { Icon, className } = iconFor(transaction.type)
                const isWithdrawal = transaction.type === 'withdrawal'
                return (
                  <div key={transaction.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${className}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900">{transaction.description || 'Wallet transaction'}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(transaction.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${isWithdrawal ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isWithdrawal ? '-Rs ' : '+Rs '}{Number(transaction.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <Badge className={`mt-1 ${statusClass(transaction.status)}`}>
                        {transaction.status === 'pending' ? 'Pending' : transaction.status === 'failed' || transaction.status === 'rejected' ? 'Failed' : 'Completed'}
                      </Badge>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ReceiptText className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm font-black uppercase tracking-widest text-slate-400">No transactions found</p>
              </div>
            )}

            {visible.length < filtered.length && (
              <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + 10)} className="h-11 w-full rounded-xl font-black">
                Load more
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
