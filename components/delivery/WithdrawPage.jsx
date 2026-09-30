'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, CalendarClock, Loader2, Wallet, Plus, Edit2, Trash2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { currentISOWeek, nextSunday, requestWithdrawal, updateSavedPaymentMethods } from '@/lib/walletService'

const upiPattern = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`
}

export default function WithdrawPage({ uid, wallet, profile }) {
  const [amount, setAmount] = useState(Math.min(Math.max(Number(wallet.balance || 0), 500), Number(wallet.balance || 0)))
  const savedMethods = profile?.savedPaymentMethods || []
  const [selectedMethodId, setSelectedMethodId] = useState(savedMethods.length > 0 ? savedMethods[0].id : null)
  
  // Method Form State
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false)
  const [methodForm, setMethodForm] = useState({ id: null, title: '', upiId: '' })
  const [savingMethod, setSavingMethod] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const eligibility = useMemo(() => {
    if (Number(wallet.balance || 0) < 500) return { ok: false, message: 'Minimum Rs 500 required' }
    if (wallet.withdrawalPending) return { ok: false, message: 'A withdrawal request is already pending.' }
    return { ok: true, message: '' }
  }, [wallet])

  const handleSaveMethod = async () => {
    if (!methodForm.title.trim()) return toast.error('Please enter a title')
    if (!upiPattern.test(methodForm.upiId)) return toast.error('Enter a valid UPI ID like name@bank')

    setSavingMethod(true)
    try {
      let newMethods = [...savedMethods]
      if (methodForm.id) {
        newMethods = newMethods.map(m => m.id === methodForm.id ? { ...methodForm } : m)
      } else {
        newMethods.push({ ...methodForm, id: Date.now().toString() })
      }
      
      await updateSavedPaymentMethods(uid, newMethods)
      if (!selectedMethodId) setSelectedMethodId(newMethods[0].id)
      setIsMethodModalOpen(false)
      toast.success('Payment method saved!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save payment method')
    } finally {
      setSavingMethod(false)
    }
  }

  const handleDeleteMethod = async (id) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return
    try {
      const newMethods = savedMethods.filter(m => m.id !== id)
      await updateSavedPaymentMethods(uid, newMethods)
      if (selectedMethodId === id) setSelectedMethodId(newMethods.length > 0 ? newMethods[0].id : null)
      toast.success('Payment method deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete payment method')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const selectedMethod = savedMethods.find(m => m.id === selectedMethodId)
    if (!selectedMethod) return toast.error('Please add or select a payment method')
    const finalUpiId = selectedMethod.upiId

    if (!upiPattern.test(finalUpiId)) return toast.error('Selected UPI ID is invalid')
    if (Number(amount) < 500) return toast.error('Minimum withdrawal amount is Rs 500')
    if (Number(amount) > Number(wallet.balance || 0)) return toast.error('Amount cannot exceed wallet balance')

    setSubmitting(true)
    try {
      await requestWithdrawal({ uid, profile, amount: Number(amount), upiId: finalUpiId })
      setSubmitted(true)
      toast.success('Withdrawal request submitted')
    } catch (error) {
      console.error(error)
      toast.error('Could not submit withdrawal request')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <Card className="mx-auto max-w-xl border-none shadow-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
            <h1 className="mt-5 text-2xl font-black text-slate-950">Withdrawal request submitted!</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">Admin will process within 24 hours.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Wallet Withdrawal</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Request Withdrawal</h1>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-950 p-5 text-white">
              <Wallet className="h-10 w-10 text-emerald-300" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Available Balance</p>
                <p className="text-3xl font-black">{money(wallet.balance)}</p>
              </div>
            </div>

            {!eligibility.ok ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <CalendarClock className="mt-0.5 h-5 w-5 flex-none" />
                <p className="text-sm font-black">{eligibility.message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Amount</Label>
                  <Input
                    type="number"
                    min="500"
                    max={wallet.balance}
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                    className="h-12 rounded-xl text-lg font-black"
                  />
                  <Slider min={500} max={wallet.balance} step={50} value={[Number(amount)]} onValueChange={([value]) => setAmount(value)} />
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Min Rs 500</span>
                    <span>Max {money(wallet.balance)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Transfer To</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="h-8 px-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
                      onClick={() => {
                        setMethodForm({ id: null, title: '', upiId: '' })
                        setIsMethodModalOpen(true)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add New
                    </Button>
                  </div>

                  {savedMethods.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400">No payment methods saved.</p>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-emerald-600 font-black"
                        onClick={() => {
                          setMethodForm({ id: null, title: '', upiId: '' })
                          setIsMethodModalOpen(true)
                        }}
                      >
                        Add one now
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedMethods.map((method) => (
                        <div 
                          key={method.id} 
                          onClick={() => setSelectedMethodId(method.id)}
                          className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedMethodId === method.id 
                              ? 'border-emerald-500 bg-emerald-50/30' 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              selectedMethodId === method.id ? 'border-emerald-500' : 'border-slate-300'
                            }`}>
                              {selectedMethodId === method.id && <div className="h-2 w-2 bg-emerald-500 rounded-full" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{method.title}</p>
                              <p className="text-xs font-bold text-slate-500">{method.upiId}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                              onClick={() => {
                                setMethodForm({ ...method })
                                setIsMethodModalOpen(true)
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteMethod(method.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting || savedMethods.length === 0} 
                  className="h-12 w-full rounded-xl bg-slate-950 font-black text-white hover:bg-slate-800"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Request Withdrawal
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Payment Method Modal */}
      <Dialog open={isMethodModalOpen} onOpenChange={setIsMethodModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {methodForm.id ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title (e.g. My GPay, Wife's PhonePe)</Label>
              <Input 
                value={methodForm.title} 
                onChange={e => setMethodForm({...methodForm, title: e.target.value})}
                placeholder="Business Account"
                className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">UPI ID</Label>
              <Input 
                value={methodForm.upiId} 
                onChange={e => setMethodForm({...methodForm, upiId: e.target.value})}
                placeholder="name@okbank"
                className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSaveMethod}
              disabled={savingMethod}
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest"
            >
              {savingMethod ? 'Saving...' : 'Save Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
