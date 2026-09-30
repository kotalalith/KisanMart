'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Smartphone, CheckCircle2, AlertTriangle, QrCode, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { generateUpiUri, UPI_APP_SCHEMES } from '@/lib/payment-service'
import { logPaymentAction } from '@/lib/payment-audit-service'

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  amount, 
  onPaymentSuccess, 
  sellerUPI = 'kisanetra@upi',
  paymentIds = [],
  orderIds = []
}) {
  const [activeTab, setActiveTab] = useState('apps') // 'apps' | 'qr'
  const [utr, setUtr] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  
  const launchTimeoutRef = useRef(null)

  // Generate general UPI URI for the QR code and deep links
  const upiUri = generateUpiUri({
    pa: sellerUPI,
    pn: 'KisaNetra Marketplace',
    am: amount,
    tn: 'KisaNetra Checkout'
  })

  // Detect when the window loses focus (app successfully launched)
  useEffect(() => {
    const handleBlur = () => {
      if (isProcessing && selectedApp) {
        if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current)
        setIsProcessing(false)
        toast.success(`Redirected to ${selectedApp.name}. Please complete payment and return here.`)
        // Auto switch to UTR entry / QR code tab so they can input the UTR easily when they return
        setActiveTab('qr')
      }
    }

    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('blur', handleBlur)
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current)
    }
  }, [isProcessing, selectedApp])

  const handleLaunchApp = (appKey) => {
    const app = UPI_APP_SCHEMES[appKey]
    if (!app) return

    setSelectedApp(app)
    setIsProcessing(true)

    const intentUrl = app.intent(upiUri)
    
    // Attempt to redirect
    const start = Date.now()
    window.location.href = intentUrl

    // Fallback: If page visibility doesn't change within 1.2 seconds, redirection failed
    launchTimeoutRef.current = setTimeout(() => {
      if (Date.now() - start < 1500) {
        setIsProcessing(false)
        toast.error(`${app.name} is not installed or deep-linking failed. Switching to QR code fallback.`)
        setActiveTab('qr')
      }
    }, 1200)
  }

  const handleVerifyUTR = async (e) => {
    e.preventDefault()
    
    // Validate UTR: 10 to 20 digit numeric
    const utrRegex = /^\d{10,20}$/
    if (!utrRegex.test(utr)) {
      toast.error("Invalid UTR format. Please enter a valid numeric reference between 10 and 20 digits.")
      return
    }

    setIsProcessing(true)
    const toastId = toast.loading("Checking UTR records...")

    try {
      // Check for duplicate UTR submissions
      const q = query(collection(db, "payments"), where("utrNumber", "==", utr))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        toast.error("This UTR reference number has already been used for another transaction.", { id: toastId })
        setIsProcessing(false)
        return
      }

      // Update the payment records and orders via batch
      const batch = writeBatch(db)
      
      for (const payId of paymentIds) {
        batch.update(doc(db, "payments", payId), {
          utrNumber: utr,
          paymentStatus: 'Pending Verification',
          updatedAt: serverTimestamp()
        })
      }

      for (const ordId of orderIds) {
        batch.update(doc(db, "orders", ordId), {
          utrNumber: utr,
          paymentStatus: 'Pending Verification',
          updatedAt: serverTimestamp()
        })
      }

      await batch.commit()

      // Log the verification submit actions
      for (let i = 0; i < paymentIds.length; i++) {
        await logPaymentAction(
          paymentIds[i],
          orderIds[i],
          "utr_submission",
          "buyer",
          `Buyer submitted UTR ${utr}.`
        )
      }

      toast.success("UTR Reference submitted successfully!", { id: toastId })
      
      // Proceed to checkout completion
      onPaymentSuccess(utr)
      onClose()
      
      // Clean up states
      setUtr('')
      setActiveTab('apps')
    } catch (error) {
      console.error("UTR verification lookup/update failed", error)
      toast.error("Verification update failed. Please try again.", { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  // QR Code URL using QRServer API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-2 shadow-2xl p-6 overflow-hidden">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-2xl font-black text-slate-900">UPI Payment Portal</DialogTitle>
          <DialogDescription className="text-sm font-semibold text-slate-500">
            Amount Payable: <span className="font-extrabold text-emerald-600 text-base">₹{amount}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Tab Headers */}
        <div className="flex bg-slate-100 p-1 rounded-2xl h-11 mb-6 border">
          <button
            onClick={() => setActiveTab('apps')}
            className={`flex-1 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'apps' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            UPI Applications
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'qr' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Scan QR & Verify
          </button>
        </div>

        {activeTab === 'apps' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center text-xs text-slate-500 leading-relaxed font-semibold">
              Select a UPI application installed on this device. You will be redirected to complete the payment.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="h-20 flex flex-col gap-2 rounded-2xl border-2 hover:border-slate-300 transition-all font-bold"
                onClick={() => handleLaunchApp('phonepe')}
                disabled={isProcessing}
              >
                <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-logo-icon.png" className="w-8 h-8 object-contain" alt="PhonePe" />
                <span>PhonePe</span>
              </Button>
              <Button 
                variant="outline"
                className="h-20 flex flex-col gap-2 rounded-2xl border-2 hover:border-slate-300 transition-all font-bold"
                onClick={() => handleLaunchApp('gpay')}
                disabled={isProcessing}
              >
                <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-pay-icon.png" className="w-8 h-8 object-contain" alt="Google Pay" />
                <span>GPay</span>
              </Button>
              <Button 
                variant="outline"
                className="h-20 flex flex-col gap-2 rounded-2xl border-2 hover:border-slate-300 transition-all font-bold"
                onClick={() => handleLaunchApp('paytm')}
                disabled={isProcessing}
              >
                <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/paytm-logo-icon.png" className="w-8 h-8 object-contain" alt="Paytm" />
                <span>Paytm</span>
              </Button>
              <Button 
                variant="outline"
                className="h-20 flex flex-col gap-2 rounded-2xl border-2 hover:border-slate-300 transition-all font-bold"
                onClick={() => handleLaunchApp('bhim')}
                disabled={isProcessing}
              >
                <Smartphone className="h-7 w-7 text-emerald-600" />
                <span>BHIM UPI</span>
              </Button>
            </div>

            <button
              onClick={() => setActiveTab('qr')}
              className="w-full text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center justify-center gap-1"
            >
              Can't redirect? Scan QR Code manually <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* QR Scanner fallback */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border rounded-3xl">
              <div className="h-48 w-48 bg-white flex items-center justify-center p-2 rounded-2xl border-2 shadow-inner relative group">
                <img src={qrCodeUrl} className="w-full h-full object-contain" alt="Scan QR to Pay" />
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
              <p className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                UPI: <span className="text-slate-700 select-all font-bold">{sellerUPI}</span>
              </p>
            </div>

            {/* UTR reference submission */}
            <form onSubmit={handleVerifyUTR} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="utr" className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  UPI Ref / UTR Number (10-20 Digits)
                </Label>
                <Input 
                  id="utr"
                  placeholder="e.g. 301234567890" 
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 20))}
                  className="h-12 rounded-2xl border-2 font-mono text-center text-lg tracking-widest focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                  <strong>Verification Warning:</strong> Do not submit false reference numbers. All UTR logs are audit-tracked. Submitting incorrect references will reject the order and may restrict your account.
                </p>
              </div>

              <Button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-sm font-black rounded-2xl shadow-lg shadow-emerald-500/10 uppercase tracking-widest gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Place Order"}
              </Button>
            </form>
          </div>
        )}

        <div className="pt-4 border-t text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            MVP Manual Settlement Active
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
