'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, CreditCard, Wallet, Building2, Smartphone, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/cart-context'
import { useOrders } from '@/lib/order-context'
import { useUser } from '@/lib/user-context'
import { useLocation, calculateDistance } from '@/lib/location-context'
import PaymentModal from '@/components/PaymentModal'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { logPaymentAction } from '@/lib/payment-audit-service'

const paymentMethods = [
  { id: 'upi', name: 'UPI Payment', description: 'Google Pay, PhonePe, Paytm, BHIM, or QR Scan', icon: Smartphone },
  { id: 'cod', name: 'Cash on Delivery (COD)', description: 'Pay when you receive', icon: Wallet },
]

export function CheckoutView() {
  const { userProfile, addresses, loading: userLoading, updateProfile } = useUser()
  const { cart, clearCart } = useCart()
  const { addOrder } = useOrders()
  
  const { isAllowed, detectedCity, refreshLocation, isChecking, userLocation, fullLocationDetails } = useLocation()
  
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('upi')
  const [isPlaced, setIsPlaced] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [sellersSettings, setSellersSettings] = useState({})
  
  const [createdOrderIds, setCreatedOrderIds] = useState([])
  const [createdPaymentIds, setCreatedPaymentIds] = useState([])

  const [useWalletCredit, setUseWalletCredit] = useState(true)

  // Fetch settings for all sellers in checkout
  useEffect(() => {
    if (cart.items.length === 0) return
    const uniqueSellerIds = Array.from(new Set(cart.items.map(item => item.product.sellerId)))
    
    const loadSettings = async () => {
      const settings = {}
      for (const sellerId of uniqueSellerIds) {
        try {
          const snap = await getDoc(doc(db, "sellers_delivery_settings", sellerId))
          if (snap.exists()) {
            settings[sellerId] = snap.data()
          } else {
            const defaultSettings = {
              radius_km: 250,
              min_order_amount: 300,
              delivery_fee: 50,
              free_delivery_threshold: 1000,
              pickup_lat: 18.5204,
              pickup_lng: 73.8567,
              allowed_pincodes: '',
              blocked_pincodes: '',
              active: true
            }
            if (sellerId === 'seller-1') { defaultSettings.pickup_lat = 18.5204; defaultSettings.pickup_lng = 73.8567; defaultSettings.radius_km = 150; }
            else if (sellerId === 'seller-2') { defaultSettings.pickup_lat = 30.9010; defaultSettings.pickup_lng = 75.8573; defaultSettings.radius_km = 500; }
            else if (sellerId === 'seller-3') { defaultSettings.pickup_lat = 16.9902; defaultSettings.pickup_lng = 73.3120; defaultSettings.radius_km = 200; }
            else if (sellerId === 'seller-4') { defaultSettings.pickup_lat = 9.9189; defaultSettings.pickup_lng = 77.1025; defaultSettings.radius_km = 400; }
            else if (sellerId === 'seller-5') { defaultSettings.pickup_lat = 19.9975; defaultSettings.pickup_lng = 73.7898; defaultSettings.radius_km = 150; }
            else if (sellerId === 'seller-6') { defaultSettings.pickup_lat = 21.5222; defaultSettings.pickup_lng = 70.4579; defaultSettings.radius_km = 300; }
            else if (sellerId === 'seller-7') { defaultSettings.pickup_lat = 17.3850; defaultSettings.pickup_lng = 78.4867; defaultSettings.radius_km = 250; }
            settings[sellerId] = defaultSettings
          }
        } catch (e) {
          console.warn("Failed to load seller settings during checkout", sellerId, e)
        }
      }
      setSellersSettings(settings)
    }

    loadSettings()
  }, [cart.items])

  // Set default address if available
  useEffect(() => {
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
    if (defaultAddr) setSelectedAddress(defaultAddr.id)
  }, [addresses])

  // Ensure selectedPayment defaults to upi if cod eligibility changes
  useEffect(() => {
    if (cart.total > 10000 && selectedPayment === 'cod') {
      setSelectedPayment('upi')
    }
  }, [cart.total, selectedPayment])

  const handlePlaceOrder = async () => {
    if (!userLocation) {
      toast.error("Please configure your delivery location before placing an order.")
      return
    }

    const address = addresses.find(a => a.id === selectedAddress)
    if (!address) {
      toast.error("Please select a delivery address")
      return
    }

    const uniqueSellerIds = Array.from(new Set(cart.items.map(item => item.product.sellerId)))
    const splitOrders = []

    for (const sellerId of uniqueSellerIds) {
      const sellerSettings = sellersSettings[sellerId]
      if (!sellerSettings) {
        toast.error("Validating delivery limits. Please click again in a moment.")
        return
      }

      if (!sellerSettings.active) {
        toast.error(`Delivery is suspended by ${cart.items.find(i => i.product.sellerId === sellerId)?.product.sellerName || 'seller'}.`)
        return
      }

      const distance = calculateDistance(userLocation.lat, userLocation.lng, sellerSettings.pickup_lat, sellerSettings.pickup_lng)
      const buyerPincode = address?.pincode ? String(address.pincode).trim() : (fullLocationDetails.pincode ? String(fullLocationDetails.pincode).trim() : '')
      
      const blockedPincodesList = sellerSettings.blocked_pincodes 
        ? sellerSettings.blocked_pincodes.split(',').map(p => p.trim()).filter(Boolean) 
        : []
      const allowedPincodesList = sellerSettings.allowed_pincodes 
        ? sellerSettings.allowed_pincodes.split(',').map(p => p.trim()).filter(Boolean) 
        : []

      if (buyerPincode && blockedPincodesList.includes(buyerPincode)) {
        toast.error(`Pincode ${buyerPincode} is not deliverable by ${cart.items.find(i => i.product.sellerId === sellerId)?.product.sellerName}.`)
        return
      }

      let isAllowedForSeller = false
      if (buyerPincode && allowedPincodesList.includes(buyerPincode)) {
        isAllowedForSeller = true
      } else if (distance <= sellerSettings.radius_km) {
        isAllowedForSeller = true
      }

      if (!isAllowedForSeller) {
        toast.error(`Your location is outside delivery radius for seller ${cart.items.find(i => i.product.sellerId === sellerId)?.product.sellerName}.`)
        return
      }

      const sellerItems = cart.items.filter(item => item.product.sellerId === sellerId)
      const splitSubtotal = sellerItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0)

      if (splitSubtotal < sellerSettings.min_order_amount) {
        toast.error(`Minimum order from ${sellerItems[0].product.sellerName} is Rs. ${sellerSettings.min_order_amount}. Current total: Rs. ${splitSubtotal}`)
        return
      }

      const splitDeliveryFee = splitSubtotal >= (sellerSettings.free_delivery_threshold || 1000)
        ? 0
        : (sellerSettings.delivery_fee || 50)
      
      const splitTax = Math.round(splitSubtotal * 0.05)
      const splitDiscount = Math.round(cart.discount * (splitSubtotal / cart.subtotal))
      
      const maxApplicableCredit = Math.min(userProfile?.walletBalance ?? 0, cart.total)
      const appliedWalletCredit = useWalletCredit ? maxApplicableCredit : 0
      const splitWalletCredit = useWalletCredit ? Math.round(appliedWalletCredit * (splitSubtotal / cart.subtotal)) : 0
      const splitTotal = Math.max(0, splitSubtotal + splitDeliveryFee + splitTax - splitDiscount - splitWalletCredit)

      splitOrders.push({
        buyerId: userProfile?.id || 'guest',
        buyerName: userProfile?.name || 'Customer',
        buyerPhone: userProfile?.phone || address?.phone || '',
        items: sellerItems.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.images[0],
          quantity: item.quantity,
          unit: item.product.unit,
          pricePerUnit: item.pricePerUnit,
          totalPrice: item.pricePerUnit * item.quantity,
          sellerId: item.product.sellerId,
          sellerName: item.product.sellerName,
        })),
        subtotal: splitSubtotal,
        deliveryFee: splitDeliveryFee,
        tax: splitTax,
        discount: splitDiscount,
        walletCreditApplied: splitWalletCredit,
        total: splitTotal,
        status: 'placed',
        paymentMethod: 'cod',
        paymentStatus: 'COD Pending',
        shippingAddress: address,
        referralDiscountApplied: cart.referralDiscountApplied || false,
        referredBy: userProfile?.referredBy || null,
        referredByCode: userProfile?.referredByCode || null,
      })
    }

    // Submit split orders
    for (const order of splitOrders) {
      const { id: createdOrderId, orderNumber } = await addOrder({
        ...order,
        utrNumber: '',
        paymentStatus: 'COD Pending'
      })

      // Write payment record to Firestore payments collection
      const payDocRef = doc(collection(db, "payments"))
      await setDoc(payDocRef, {
        paymentId: payDocRef.id,
        orderId: createdOrderId,
        buyerId: order.buyerId,
        amount: order.total,
        paymentMethod: 'cod',
        utrNumber: '',
        paymentStatus: 'COD Pending',
        createdAt: serverTimestamp(),
        verifiedBy: null,
        verifiedAt: null,
        remarks: ''
      })

      // Log action to audits
      await logPaymentAction(
        payDocRef.id,
        createdOrderId,
        "creation",
        userProfile?.id || 'guest',
        "COD Order confirmed."
      )
    }

    if (cart.referralDiscountApplied) {
      await updateProfile({ firstOrderDiscountEligible: false })
    }

    const maxApplicableCredit = Math.min(userProfile?.walletBalance ?? 0, cart.total)
    const appliedWalletCredit = useWalletCredit ? maxApplicableCredit : 0
    if (useWalletCredit && appliedWalletCredit > 0) {
      await updateProfile({
        walletBalance: increment(-appliedWalletCredit),
        updatedAt: serverTimestamp()
      })
      
      const txRef = doc(collection(db, "wallet_transactions"))
      await setDoc(txRef, {
        id: txRef.id,
        userId: userProfile.id,
        type: 'debit',
        amount: appliedWalletCredit,
        note: `Used on Orders: ${splitOrders.map(o => o.items[0]?.productName).join(", ")}`,
        createdAt: new Date().toISOString()
      })
    }

    setIsPlaced(true)
    clearCart()
  }

  const handleCheckoutSubmit = async () => {
    if (!userLocation) {
      toast.error("Please configure your delivery location before placing an order.")
      return
    }

    const address = addresses.find(a => a.id === selectedAddress)
    if (!address) {
      toast.error("Please select a delivery address")
      return
    }

    if (selectedPayment === 'cod') {
      if (cart.total > 10000) {
        toast.error("Cash on Delivery is only eligible for orders below ₹10,000. Please pay using UPI.")
        return
      }
      await handlePlaceOrder()
    } else if (selectedPayment === 'upi') {
      // Check for duplicate pending session
      try {
        const q = query(
          collection(db, "payments"),
          where("buyerId", "==", userProfile?.id || 'guest'),
          where("paymentMethod", "==", "upi"),
          where("paymentStatus", "in", ["Pending Payment", "Pending Verification"])
        )
        const snap = await getDocs(q)
        
        if (!snap.empty) {
          const payIds = snap.docs.map(d => d.id)
          const ordIds = snap.docs.map(d => d.data().orderId)
          setCreatedPaymentIds(payIds)
          setCreatedOrderIds(ordIds)
          setShowPaymentModal(true)
          toast.info("Resumed your pending payment session.")
          return
        }

        // Initialize orders and payments in Pending Payment first
        const uniqueSellerIds = Array.from(new Set(cart.items.map(item => item.product.sellerId)))
        const splitOrders = []

        for (const sellerId of uniqueSellerIds) {
          const sellerSettings = sellersSettings[sellerId]
          if (!sellerSettings) {
            toast.error("Validating delivery limits. Please try again.")
            return
          }

          const distance = calculateDistance(userLocation.lat, userLocation.lng, sellerSettings.pickup_lat, sellerSettings.pickup_lng)
          const buyerPincode = address?.pincode ? String(address.pincode).trim() : (fullLocationDetails.pincode ? String(fullLocationDetails.pincode).trim() : '')
          
          let isAllowedForSeller = false
          if (sellerSettings.allowed_pincodes?.split(',').map(p => p.trim()).includes(buyerPincode)) {
            isAllowedForSeller = true
          } else if (distance <= sellerSettings.radius_km) {
            isAllowedForSeller = true
          }

          if (!isAllowedForSeller) {
            toast.error(`Outside delivery radius for seller ${cart.items.find(i => i.product.sellerId === sellerId)?.product.sellerName}.`)
            return
          }

          const sellerItems = cart.items.filter(item => item.product.sellerId === sellerId)
          const splitSubtotal = sellerItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0)

          const splitDeliveryFee = splitSubtotal >= (sellerSettings.free_delivery_threshold || 1000) ? 0 : (sellerSettings.delivery_fee || 50)
          const splitTax = Math.round(splitSubtotal * 0.05)
          const splitDiscount = Math.round(cart.discount * (splitSubtotal / cart.subtotal))
          
          const maxApplicableCredit = Math.min(userProfile?.walletBalance ?? 0, cart.total)
          const appliedWalletCredit = useWalletCredit ? maxApplicableCredit : 0
          const splitWalletCredit = useWalletCredit ? Math.round(appliedWalletCredit * (splitSubtotal / cart.subtotal)) : 0
          const splitTotal = Math.max(0, splitSubtotal + splitDeliveryFee + splitTax - splitDiscount - splitWalletCredit)

          splitOrders.push({
            buyerId: userProfile?.id || 'guest',
            buyerName: userProfile?.name || 'Customer',
            buyerPhone: userProfile?.phone || address?.phone || '',
            items: sellerItems.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.product.name,
              productImage: item.product.images[0],
              quantity: item.quantity,
              unit: item.product.unit,
              pricePerUnit: item.pricePerUnit,
              totalPrice: item.pricePerUnit * item.quantity,
              sellerId: item.product.sellerId,
              sellerName: item.product.sellerName,
            })),
            subtotal: splitSubtotal,
            deliveryFee: splitDeliveryFee,
            tax: splitTax,
            discount: splitDiscount,
            walletCreditApplied: splitWalletCredit,
            total: splitTotal,
            status: 'placed',
            paymentMethod: 'upi',
            paymentStatus: 'Pending Payment',
            shippingAddress: address,
            referralDiscountApplied: cart.referralDiscountApplied || false,
            referredBy: userProfile?.referredBy || null,
            referredByCode: userProfile?.referredByCode || null,
          })
        }

        const payIds = []
        const ordIds = []

        for (const order of splitOrders) {
          const { id: createdOrderId, orderNumber } = await addOrder({
            ...order,
            utrNumber: '',
            paymentStatus: 'Pending Payment'
          })

          const payDocRef = doc(collection(db, "payments"))
          await setDoc(payDocRef, {
            paymentId: payDocRef.id,
            orderId: createdOrderId,
            orderNumber,
            buyerId: order.buyerId,
            buyerName: order.buyerName,
            amount: order.total,
            paymentMethod: 'upi',
            utrNumber: '',
            paymentStatus: 'Pending Payment',
            createdAt: serverTimestamp(),
            verifiedBy: null,
            verifiedAt: null,
            remarks: ''
          })

          payIds.push(payDocRef.id)
          ordIds.push(createdOrderId)

          // Log payment creation audit
          await logPaymentAction(
            payDocRef.id,
            createdOrderId,
            "creation",
            userProfile?.id || 'guest',
            "UPI Payment session initialized."
          )
        }

        if (cart.referralDiscountApplied) {
          await updateProfile({ firstOrderDiscountEligible: false })
        }

        const maxApplicableCredit = Math.min(userProfile?.walletBalance ?? 0, cart.total)
        const appliedWalletCredit = useWalletCredit ? maxApplicableCredit : 0
        if (useWalletCredit && appliedWalletCredit > 0) {
          await updateProfile({
            walletBalance: increment(-appliedWalletCredit),
            updatedAt: serverTimestamp()
          })
          
          const txRef = doc(collection(db, "wallet_transactions"))
          await setDoc(txRef, {
            id: txRef.id,
            userId: userProfile.id,
            type: 'debit',
            amount: appliedWalletCredit,
            note: `Used on Orders: ${splitOrders.map(o => o.items[0]?.productName).join(", ")}`,
            createdAt: new Date().toISOString()
          })
        }

        setCreatedPaymentIds(payIds)
        setCreatedOrderIds(ordIds)
        setShowPaymentModal(true)
        clearCart()
      } catch (err) {
        console.error("Failed duplicate check or order creation", err)
        toast.error("Initialization failed. Please click again.")
      }
    }
  }

  if (userLoading) {
    return <div className="h-60 flex items-center justify-center"><Smartphone className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  if (isPlaced) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">Order Placed Successfully!</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Your order has been placed successfully.<br />
          {selectedPayment === 'upi' ? 'It will be reviewed by administrators for UPI confirmation.' : 'Sellers will confirm details before dispatch.'}
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/orders">
            <Button>View Orders</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold text-foreground">No items to checkout</h2>
        <Link href="/">
          <Button className="mt-4">Go Shopping</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Delivery Address Error */}
        {isAllowed === false && (
          <Card className="border-orange-200 bg-orange-50 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-orange-600 text-white">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-orange-950">Delivery is not available in {detectedCity || 'your area'}</h3>
                  <p className="mt-1 text-sm font-semibold text-orange-800/80">
                    Normal checkout is blocked for this location. Please update your address to a serviceable location.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={refreshLocation} disabled={isChecking} className="rounded-xl bg-white font-bold">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
              {addresses.map((address) => (
                <div key={address.id} className="flex items-start gap-3 rounded-lg border p-4">
                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                  <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{address.label}</span>
                      {address.isDefault && (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 font-bold border border-emerald-100">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {address.fullName}, {address.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button variant="outline" className="mt-4 w-full">
              Add New Address
            </Button>
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
              {paymentMethods.map((method) => {
                const isCod = method.id === 'cod'
                const isCodDisabled = isCod && cart.total > 10000

                return (
                  <div key={method.id} className="space-y-3">
                    <div className={cn(
                      "flex items-center gap-3 rounded-2xl border p-4 transition-all duration-300",
                      isCodDisabled ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200" :
                      selectedPayment === method.id ? "border-emerald-500 bg-emerald-50/20 shadow-sm" : "hover:border-slate-300 cursor-pointer"
                    )}>
                      <RadioGroupItem 
                        value={method.id} 
                        id={method.id} 
                        disabled={isCodDisabled}
                      />
                      <Label htmlFor={method.id} className={cn("flex flex-1 items-center gap-3", isCodDisabled ? "cursor-not-allowed" : "cursor-pointer")}>
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          isCodDisabled ? "bg-slate-200 text-slate-400" :
                          selectedPayment === method.id ? "bg-emerald-500 text-white" : "bg-muted"
                        )}>
                          <method.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {method.name}
                            {isCodDisabled && (
                              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                                Over ₹10k Limit
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isCodDisabled 
                              ? "Cash on Delivery is only available for orders below ₹10,000." 
                              : method.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items Preview */}
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>Rs. {item.pricePerUnit * item.quantity}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Rs. {cart.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{cart.deliveryFee === 0 ? 'FREE' : `Rs. ${cart.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span>Rs. {cart.tax}</span>
              </div>
            </div>
            <Separator />
            {userProfile?.walletBalance > 0 && (
              <>
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">Your ₹{userProfile.walletBalance} wallet credit has been automatically applied.</span>
                  </div>
                </div>
                {useWalletCredit && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span>Wallet Credit Applied</span>
                    <span>-Rs. {Math.min(userProfile?.walletBalance ?? 0, cart.total)}</span>
                  </div>
                )}
                <Separator />
              </>
            )}
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-emerald-600">Rs. {Math.max(0, cart.total - (useWalletCredit ? Math.min(userProfile?.walletBalance ?? 0, cart.total) : 0))}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCheckoutSubmit}
              disabled={isAllowed === false}
            >
              {isAllowed === false 
                ? 'Delivery Not Available Here' 
                : selectedPayment === 'upi' 
                  ? `Pay & Place Order - Rs. ${Math.max(0, cart.total - (useWalletCredit ? Math.min(userProfile?.walletBalance ?? 0, cart.total) : 0))}` 
                  : `Confirm COD Order - Rs. ${Math.max(0, cart.total - (useWalletCredit ? Math.min(userProfile?.walletBalance ?? 0, cart.total) : 0))}`}
            </Button>
            <Link href="/cart" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Cart
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={cart.total}
        paymentIds={createdPaymentIds}
        orderIds={createdOrderIds}
        onPaymentSuccess={() => {
          setIsPlaced(true)
        }}
      />

    </div>
  )
}





