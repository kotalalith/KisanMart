'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Ticket, X, ChevronRight, Tag, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart-context'
import { usePromotions } from '@/lib/promotions-context'
import { useLocation, calculateDistance } from '@/lib/location-context'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function CartView() {
  const { cart, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon } = useCart()
  const { promotions } = usePromotions()
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false)

  const { userLocation, fullLocationDetails } = useLocation()
  const [sellersSettings, setSellersSettings] = useState({})
  const [validatingLoading, setValidatingLoading] = useState(true)

  // Fetch settings for all sellers in the cart
  useEffect(() => {
    if (cart.items.length === 0) {
      setValidatingLoading(false)
      return
    }

    const uniqueSellerIds = Array.from(new Set(cart.items.map(item => item.product.sellerId)))
    let active = true

    const loadSettings = async () => {
      setValidatingLoading(true)
      const settings = {}
      for (const sellerId of uniqueSellerIds) {
        try {
          const docSnap = await getDoc(doc(db, "sellers_delivery_settings", sellerId))
          if (docSnap.exists()) {
            settings[sellerId] = docSnap.data()
          } else {
            // Mock Fallbacks
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
          console.warn("Failed to fetch settings for seller", sellerId, e)
        }
      }
      if (active) {
        setSellersSettings(settings)
        setValidatingLoading(false)
      }
    }

    loadSettings()
    return () => { active = false }
  }, [cart.items, userLocation])

  const validateItem = useCallback((item) => {
    if (!userLocation) return { allowed: true, reason: 'No location configured' }
    const sellerId = item.product.sellerId
    const settings = sellersSettings[sellerId]
    if (!settings) return { allowed: true, reason: 'Loading settings' }

    if (!settings.active) {
      return { allowed: false, reason: 'Seller delivery suspended' }
    }

    const distance = calculateDistance(userLocation.lat, userLocation.lng, settings.pickup_lat, settings.pickup_lng)
    const buyerPincode = fullLocationDetails.pincode ? String(fullLocationDetails.pincode).trim() : ''
    const blockedPincodesList = settings.blocked_pincodes 
      ? settings.blocked_pincodes.split(',').map(p => p.trim()).filter(Boolean) 
      : []
    const allowedPincodesList = settings.allowed_pincodes 
      ? settings.allowed_pincodes.split(',').map(p => p.trim()).filter(Boolean) 
      : []

    if (buyerPincode && blockedPincodesList.includes(buyerPincode)) {
      return { allowed: false, reason: 'Pincode blocked by seller' }
    }
    if (buyerPincode && allowedPincodesList.includes(buyerPincode)) {
      return { allowed: true, reason: 'Pincode explicitly allowed' }
    }
    if (distance > settings.radius_km) {
      return { allowed: false, reason: `Too far (distance: ${distance.toFixed(0)}km, limit: ${settings.radius_km}km)` }
    }

    return { allowed: true, reason: '' }
  }, [sellersSettings, userLocation, fullLocationDetails])

  const hasUnserviceableItems = cart.items.some(item => !validateItem(item).allowed)

  // Filter active promotions
  const activePromos = promotions.filter(p => p.status === 'active')

  // Find nearest coupon
  const subtotal = cart.subtotal
  // We want the coupon that is closest to being unlocked (subtotal < minOrder)
  // or a coupon that is already unlocked but not applied.
  // Let's sort them by minOrder.
  const sortedPromos = [...activePromos].sort((a, b) => a.minOrder - b.minOrder)
  
  let nearestPromo = null
  let bestAvailablePromo = null

  // Find a promo that is valid now, and one that is the next to be unlocked
  for (const promo of sortedPromos) {
    if (subtotal >= promo.minOrder) {
      // It's available
      bestAvailablePromo = promo; // This will keep the one with highest minOrder (best)
    } else {
      if (!nearestPromo) {
        nearestPromo = promo;
      }
    }
  }

  // Which one to show outside?
  // If no coupon is applied, show best available, else show nearest to unlock.
  const promoToShowOutside = cart.appliedCoupon ? nearestPromo : (bestAvailablePromo || nearestPromo)

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add some fresh produce to get started
        </p>
        <Link href="/">
          <Button className="mt-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Shopping Cart ({cart.items.length} items)</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
              Clear All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-2.5 sm:gap-4 rounded-2xl border p-3 sm:p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all hover:border-slate-200">
                {/* Image placeholder - dynamic sizing */}
                <Link href={`/product/${item.productId}`} className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-xl bg-secondary/50 flex items-center justify-center hover:opacity-80 transition-opacity">
                  <span className="text-base sm:text-xl font-bold text-primary/40">
                    {item.product.name.charAt(0)}
                  </span>
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col min-w-0">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <Link href={`/product/${item.productId}`}>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base hover:text-primary transition-colors truncate">{item.product.name}</h3>
                      </Link>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Sold by {item.product.sellerName}
                      </p>
                      {!validateItem(item).allowed && (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] font-black uppercase text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-0.5 w-fit">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Unserviceable: {validateItem(item).reason}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                      onClick={() => removeFromCart(item.cartItemId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 items-center justify-between pt-3 border-t border-slate-50 mt-3">
                    <div className="flex items-center justify-between w-28 sm:w-32 h-9 sm:h-10 rounded-full border-2 border-primary/20 bg-white shadow-sm p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                        onClick={() => {
                          if (item.quantity === 1) {
                            removeFromCart(item.cartItemId)
                          } else {
                            updateQuantity(item.cartItemId, item.quantity - 1)
                          }
                        }}
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                      </Button>
                      <div className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-black text-primary leading-none">{item.quantity}</span>
                        <span className="text-[8px] font-bold text-primary/60 uppercase tracking-tighter leading-none mt-0.5">Added</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-base sm:text-lg font-black text-slate-900 leading-none">
                        Rs. {item.pricePerUnit * item.quantity}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-bold leading-normal">
                        Rs. {item.pricePerUnit}/{item.variantLabel || item.product.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Order Summary & Coupons */}
      <div className="space-y-6">
        {/* Coupons Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5 text-primary" />
              Coupons & Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Applied Coupon Display */}
            {cart.appliedCoupon ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-700">{cart.appliedCoupon.code}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeCoupon} className="h-6 text-green-700 hover:text-green-800 hover:bg-green-100">
                    Remove
                  </Button>
                </div>
                <p className="mt-1 text-sm text-green-600">
                  {cart.appliedCoupon.type === 'percentage' 
                    ? `You saved ${cart.appliedCoupon.value}% (up to Rs. ${cart.appliedCoupon.maxDiscount})`
                    : `You saved Rs. ${cart.appliedCoupon.value}`}
                </p>
              </div>
            ) : null}

            {/* Nearest or Best Available Promo Display */}
            {promoToShowOutside && !cart.appliedCoupon && (
              <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{promoToShowOutside.code}</span>
                  <Badge variant="outline" className="border-primary text-primary">
                    {promoToShowOutside.type === 'percentage' ? `${promoToShowOutside.value}% OFF` : `FLAT Rs. ${promoToShowOutside.value} OFF`}
                  </Badge>
                </div>
                {subtotal < promoToShowOutside.minOrder ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add <span className="font-bold text-primary">Rs. {promoToShowOutside.minOrder - subtotal}</span> more to unlock this offer!
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-green-600 font-medium">
                    Offer unlocked! Apply now to save.
                  </p>
                )}
              </div>
            )}

            <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between group">
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">View all coupons</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Available Coupons</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {activePromos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No coupons available right now.</p>
                  ) : (
                    activePromos.map(promo => {
                      const isUnlocked = subtotal >= promo.minOrder
                      const isApplied = cart.appliedCoupon?.id === promo.id

                      return (
                        <div key={promo.id} className={`rounded-xl border p-4 ${isApplied ? 'border-primary bg-primary/5' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold border border-dashed border-primary px-2 py-1 rounded bg-primary/10 text-primary uppercase tracking-wider text-sm">{promo.code}</span>
                              </div>
                              <p className="mt-2 font-medium text-foreground">{promo.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {promo.type === 'percentage' ? `Get ${promo.value}% off` : `Get flat Rs. ${promo.value} off`}
                                {promo.maxDiscount > 0 ? ` up to Rs. ${promo.maxDiscount}` : ''} on orders above Rs. {promo.minOrder}.
                              </p>
                            </div>
                            <div>
                              {isApplied ? (
                                <Button size="sm" variant="outline" onClick={() => removeCoupon()}>
                                  Remove
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  disabled={!isUnlocked}
                                  onClick={() => {
                                    applyCoupon(promo)
                                    setIsCouponDialogOpen(false)
                                  }}
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          </div>
                          {!isUnlocked && (
                            <div className="mt-3 bg-muted/50 rounded p-2 text-xs text-muted-foreground">
                              Add <span className="font-bold text-foreground">Rs. {promo.minOrder - subtotal}</span> more to your cart to unlock this coupon.
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">Rs. {cart.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">
                {cart.deliveryFee === 0 ? (
                  <span className="text-primary">FREE</span>
                ) : (
                  `Rs. ${cart.deliveryFee}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (5%)</span>
              <span className="font-medium">Rs. {cart.tax}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount {cart.appliedCoupon && `(${cart.appliedCoupon.code})`}</span>
                <span className="font-medium text-green-600">-Rs. {cart.discount}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">Rs. {cart.total}</span>
            </div>
            {cart.subtotal < 500 && (
              <p className="text-xs text-muted-foreground">
                Add Rs. {500 - cart.subtotal} more for free delivery
              </p>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {hasUnserviceableItems ? (
              <div className="w-full space-y-1.5">
                <Button className="w-full bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed text-xs font-black uppercase tracking-wider" disabled>
                  Unserviceable items in cart
                </Button>
                <p className="text-[10px] text-red-500 font-bold text-center leading-normal">
                  Some items cannot be delivered to your active location. Remove them to proceed.
                </p>
              </div>
            ) : (
              <Link href="/checkout" className="w-full">
                <Button className="w-full">Proceed to Checkout</Button>
              </Link>
            )}
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}






