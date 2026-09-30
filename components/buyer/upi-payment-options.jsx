'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ArrowRight, Smartphone, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useUser } from '@/lib/user-context'

/**
 * UPIPaymentOptions
 * @param {string} sellerUpiId - The UPI ID of the seller (e.g., vpa@upi)
 * @param {string} sellerName - The name to display in the payment app
 * @param {number} amount - The amount to pay
 * @param {string} note - Transaction note
 */
export function UPIPaymentOptions({ sellerUpiId, sellerName, amount, note = "Payment for Agromarket Order" }) {
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [customUpi, setCustomUpi] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState(null)
  const { userProfile } = useUser()
  const timerRef = useRef(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const generateUpiUrl = (appPrefix = 'upi', receiverId = sellerUpiId) => {
    const baseUrl = appPrefix === 'gpay' ? 'tez://upi/pay' : `${appPrefix}://pay`
    const params = [
      `pa=${receiverId}`,
      `am=${amount}`,
      `cu=INR`,
      `mc=0000`, 
      `mode=02`  
    ].join('&')
    return `${baseUrl}?${params}`
  }

  const handlePayment = async (methodId) => {
    setIsProcessing(true)
    setError(null)
    setSelectedMethod(methodId)

    let url = ''
    let fallback = ''
    const isAndroid = /Android/i.test(navigator.userAgent)
    const finalSellerName = "Crop-Connect"

    switch (methodId) {
      case 'phonepe':
        url = generateUpiUrl('phonepe')
        fallback = isAndroid 
          ? 'https://play.google.com/store/apps/details?id=com.phonepe.app' 
          : 'https://apps.apple.com/in/app/phonepe-upi-payments-recharge/id1170342019'
        break
      case 'gpay':
        url = generateUpiUrl('gpay')
        fallback = isAndroid 
          ? 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user' 
          : 'https://apps.apple.com/in/app/google-pay-save-and-pay/id1193357041'
        break
      case 'custom':
        if (customUpi && !customUpi.includes('@')) {
          setError('Please enter a valid UPI ID')
          setIsProcessing(false)
          return
        }
        url = generateUpiUrl('upi', customUpi || sellerUpiId)
        break
      default:
        url = generateUpiUrl('upi')
    }

    // Attempt to open the app
    window.location.href = url

    // Listen for when the user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timerRef.current) clearTimeout(timerRef.current)
        setIsProcessing(false)
        setShowVerification(true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange, { once: true })

    timerRef.current = setTimeout(() => {
      setIsProcessing(false)
      if (fallback) {
        // Only show fallback if we're still on the same page and not confirmed
        if (confirm("Payment app not found. Install from Store?")) {
          window.location.href = fallback
        }
      }
    }, 2500)
  }

  const confirmPaymentSuccess = async () => {
    setIsProcessing(true)
    const methodNames = {
      'phonepe': 'UPI - PhonePe',
      'gpay': 'UPI - Google Pay',
      'any': 'UPI - Other App',
      'custom': 'UPI - Custom ID'
    }

    try {
      // 1. Create the bank record in Firestore
      const docRef = await addDoc(collection(db, "payments"), {
        userId: userProfile?.uid || 'guest',
        userName: userProfile?.name || 'Guest User',
        amount: amount,
        method: methodNames[selectedMethod] || selectedMethod || 'UPI',
        status: 'verified',
        note: note,
        receiver: 'Crop-Connect',
        createdAt: serverTimestamp()
      })

      // 2. Trigger the order confirmation in the parent component
      if (window.__agro_handlePlaceOrder) {
        window.__agro_handlePlaceOrder(methodNames[selectedMethod] || selectedMethod || 'UPI')
      }
      
      setOrderId(docRef.id)
    } catch (e) {
      console.error("Firebase Error:", e)
      setError("Failed to record payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (showVerification) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[2.5rem] border-2 border-emerald-100 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500 relative overflow-hidden">
        {orderId ? (
          <div className="space-y-6 py-4">
            <div className="mx-auto w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-50 shadow-lg animate-bounce">
              <Check className="h-10 w-10 text-white stroke-[4px]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Order Placed!</h3>
              <p className="text-slate-500 text-sm font-medium">Payment of <span className="text-emerald-600 font-bold">Rs. {amount}</span> confirmed.</p>
            </div>
            <Button 
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold gap-2"
              onClick={() => window.location.href = '/orders'}
            >
              View Orders <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
               <AlertCircle className="h-8 w-8" />
             </div>
             <div className="space-y-2">
               <h3 className="text-xl font-black text-slate-900">Did you complete the payment?</h3>
               <p className="text-sm text-slate-500 px-2 font-medium italic">Click yes only if the money was deducted from your bank.</p>
             </div>
             
             <div className="space-y-3 pt-2">
               <Button 
                 disabled={isProcessing}
                 className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg font-black shadow-lg shadow-emerald-200"
                 onClick={() => confirmPaymentSuccess()}
               >
                 {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "YES, I PAID SUCCESSFULLY"}
               </Button>
               <Button 
                 variant="ghost"
                 disabled={isProcessing}
                 className="w-full h-12 rounded-xl text-slate-400 font-bold"
                 onClick={() => {
                   setShowVerification(false)
                   setSelectedMethod(null)
                 }}
               >
                 NO, PAYMENT FAILED
               </Button>
             </div>
          </div>
        )}
      </div>
    )
  }

  const paymentMethods = [
    { id: 'phonepe', name: 'PhonePe', color: 'bg-[#5f259f]', textColor: 'text-white' },
    { id: 'gpay', name: 'Google Pay', color: 'bg-white', textColor: 'text-gray-900', border: 'border-gray-200' },
    { id: 'any', name: 'Paytm / Any App', color: 'bg-blue-50', textColor: 'text-blue-700', border: 'border-blue-100' },
    { id: 'custom', name: 'Other UPI ID', color: 'bg-emerald-50', textColor: 'text-emerald-700', border: 'border-emerald-100' }
  ]

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-4 sm:p-0">
      <div className="space-y-2 text-center sm:text-left">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Options</h3>
        <p className="text-sm text-slate-500 font-medium">Select your UPI app to pay <span className="text-slate-900 font-bold">Rs. {amount}</span></p>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <div key={method.id} className="space-y-3">
            <button
              onClick={() => {
                if (method.id !== 'custom') handlePayment(method.id)
                else setSelectedMethod('custom')
              }}
              className={cn(
                "relative w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
                selectedMethod === method.id 
                  ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/10" 
                  : "border-slate-100 bg-white hover:border-slate-200 shadow-sm",
                isProcessing && "opacity-50 pointer-events-none"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shadow-inner overflow-hidden",
                  method.color,
                  method.border
                )}>
                  {method.id === 'phonepe' && <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-logo-icon.png" className="w-8 h-8 object-contain" alt="PhonePe" />}
                  {method.id === 'gpay' && <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-pay-icon.png" className="w-8 h-8 object-contain" alt="GPay" />}
                  {method.id === 'any' && <Smartphone className="h-6 w-6 text-blue-600" />}
                  {method.id === 'custom' && <Smartphone className="h-6 w-6 text-emerald-600" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{method.name}</p>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Fast & Secure</p>
                </div>
              </div>
            </button>

            {selectedMethod === 'custom' && method.id === 'custom' && (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <Input 
                  placeholder="example@okaxis" 
                  value={customUpi}
                  onChange={(e) => setCustomUpi(e.target.value)}
                  className="h-12 rounded-xl border-emerald-200"
                />
                <Button 
                  onClick={() => handlePayment('custom')}
                  className="w-full h-12 rounded-xl bg-emerald-600 font-bold"
                  disabled={isProcessing}
                >
                  Pay via UPI
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paying To</p>
            <p className="text-sm font-bold text-slate-900">{sellerName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
            <p className="text-lg font-black text-emerald-600">Rs. {amount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
