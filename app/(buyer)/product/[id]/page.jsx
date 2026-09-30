'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProducts } from '@/lib/product-context'
import { useSellers, SELLER_TYPES } from '@/lib/seller-context'
import { ProductCard } from '@/components/buyer/product-card'
import { ProductGrid } from '@/components/buyer/product-grid'
import { useCart } from '@/lib/cart-context'
import { Star, Leaf, Heart, Plus, Minus, ArrowLeft, ShieldCheck, Truck, RotateCcw, Check, AlertTriangle, MapPin, Loader2, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useLocation, calculateDistance } from '@/lib/location-context'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LocationModal } from '@/components/buyer/location-modal'
export default function ProductDetailsPage() {
  const params = useParams()
  const { products, getProductById } = useProducts()
  const { addToCart, updateQuantity, removeFromCart, cart, wishlist, toggleWishlist } = useCart()
  const { sellers } = useSellers()
  
  const product = getProductById(params.id)
  const productSeller = sellers.find(s => s.id === product?.sellerId)

  const { userLocation, fullLocationDetails } = useLocation()
  const [sellerSettings, setSellerSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  useEffect(() => {
    if (!product?.sellerId) return
    
    const docRef = doc(db, "sellers_delivery_settings", product.sellerId)
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSellerSettings(snap.data())
      } else {
        const defaultSettings = {
          radius_km: 250,
          min_order_amount: 300,
          delivery_fee: 50,
          free_delivery_threshold: 1000,
          same_day_delivery: true,
          pickup_lat: 18.5204, 
          pickup_lng: 73.8567,
          allowed_pincodes: '',
          blocked_pincodes: '',
          active: true
        }

        if (product.sellerId === 'seller-1') {
          defaultSettings.pickup_lat = 18.5204
          defaultSettings.pickup_lng = 73.8567
          defaultSettings.radius_km = 150
        } else if (product.sellerId === 'seller-2') {
          defaultSettings.pickup_lat = 30.9010
          defaultSettings.pickup_lng = 75.8573
          defaultSettings.radius_km = 500
        } else if (product.sellerId === 'seller-3') {
          defaultSettings.pickup_lat = 16.9902
          defaultSettings.pickup_lng = 73.3120
          defaultSettings.radius_km = 200
        } else if (product.sellerId === 'seller-4') {
          defaultSettings.pickup_lat = 9.9189
          defaultSettings.pickup_lng = 77.1025
          defaultSettings.radius_km = 400
        } else if (product.sellerId === 'seller-5') {
          defaultSettings.pickup_lat = 19.9975
          defaultSettings.pickup_lng = 73.7898
          defaultSettings.radius_km = 150
        } else if (product.sellerId === 'seller-6') {
          defaultSettings.pickup_lat = 21.5222
          defaultSettings.pickup_lng = 70.4579
          defaultSettings.radius_km = 300
        } else if (product.sellerId === 'seller-7') {
          defaultSettings.pickup_lat = 17.3850
          defaultSettings.pickup_lng = 78.4867
          defaultSettings.radius_km = 250
        }

        setSellerSettings(defaultSettings)
      }
      setSettingsLoading(false)
    })

    return () => unsubscribe()
  }, [product?.sellerId])
  
  // Helper function to get numeric weight from label (e.g., "250g" -> 250, "1kg" -> 1000)
  const getWeightFromLabel = (label) => {
    if (!label) return 0;
    const str = label.toLowerCase();
    const num = parseFloat(str) || 0;
    if (str.includes('kg') || str.includes('kilo')) return num * 1000;
    if (str.includes('ton')) return num * 1000000;
    return num;
  };

  const sortedVariants = product?.variants ? [...product.variants].sort((a, b) => 
    getWeightFromLabel(a.label) - getWeightFromLabel(b.label)
  ) : [];

  const [selectedVariant, setSelectedVariant] = useState(sortedVariants.length > 0 ? sortedVariants[0] : null)
  const [activeImage, setActiveImage] = useState(0)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Product not found</h2>
        <Link href="/">
          <Button className="mt-4">Back to Home</Button>
        </Link>
      </div>
    )
  }
  
  const currentItemKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id
  const cartItem = cart.items.find((item) => item.cartItemId === currentItemKey)
  const quantity = cartItem?.quantity || 0
  const isLiked = wishlist.includes(product.id)

  const displayPrice = selectedVariant ? selectedVariant.price : product.basePrice
  const globalStock = parseFloat(product.stockQty || product.stock || 0)
  const currentStock = globalStock // Use global stock for all checks
  const isCurrentVariantAvailable = globalStock > 0

  // Delivery Availability Calculations
  let isDeliverable = false
  let distance = 0
  let estimatedTime = ''
  let shippingCharge = ''
  let statusReason = ''

  if (userLocation && sellerSettings) {
    distance = calculateDistance(userLocation.lat, userLocation.lng, sellerSettings.pickup_lat, sellerSettings.pickup_lng)
    
    const buyerPincode = fullLocationDetails.pincode ? String(fullLocationDetails.pincode).trim() : ''
    const blockedPincodesList = sellerSettings.blocked_pincodes 
      ? sellerSettings.blocked_pincodes.split(',').map(p => p.trim()).filter(Boolean) 
      : []
    const allowedPincodesList = sellerSettings.allowed_pincodes 
      ? sellerSettings.allowed_pincodes.split(',').map(p => p.trim()).filter(Boolean) 
      : []

    if (buyerPincode && blockedPincodesList.includes(buyerPincode)) {
      isDeliverable = false
      statusReason = 'Pincode blocked by seller'
    } else if (buyerPincode && allowedPincodesList.includes(buyerPincode)) {
      isDeliverable = true
      statusReason = 'Pincode explicitly allowed'
    } else if (distance <= sellerSettings.radius_km) {
      isDeliverable = true
    } else {
      isDeliverable = false
      statusReason = 'Distance exceeds seller delivery radius'
    }

    if (isDeliverable) {
      if (sellerSettings.same_day_delivery && distance <= 35) {
        estimatedTime = 'Same-Day (Express)'
      } else if (distance <= 50) {
        estimatedTime = '1-2 Days (Priority)'
      } else if (distance <= 200) {
        estimatedTime = '2-3 Days'
      } else {
        estimatedTime = '4-6 Days'
      }

      shippingCharge = displayPrice >= (sellerSettings.free_delivery_threshold || 1000)
        ? 'FREE Delivery'
        : `Rs. ${sellerSettings.delivery_fee || 50}`
    }
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Breadcrumbs / Back */}
      <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/30 border">
            {product.images?.[activeImage] ? (
              <img 
                src={product.images[activeImage]} 
                alt={product.name} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary/40">
                    {product.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={`absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-md transition-all hover:scale-110 active:scale-95 ${
                isLiked ? 'text-red-500 border-red-100' : 'text-muted-foreground border-slate-100'
              }`}
            >
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.isOrganic && (
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 px-3 py-1">
                  <Leaf className="h-4 w-4" />
                  Organic Certified
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === idx ? 'border-primary shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              {product.categoryName}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>
            
            {productSeller && (
              <div className="flex items-center gap-2 pt-1 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Sold by:</span>
                <span className="text-sm font-bold text-foreground">{productSeller.businessName}</span>
                {productSeller.sellerType && SELLER_TYPES[productSeller.sellerType.toUpperCase()] && (
                  <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 text-[10px] px-2 py-0">
                    {productSeller.sellerType === 'farmer' ? '🌾' : productSeller.sellerType === 'organic' ? '🍯' : productSeller.sellerType === 'processed' ? '🏪' : '🚜'} {SELLER_TYPES[productSeller.sellerType.toUpperCase()].label}
                  </Badge>
                )}
                {productSeller.kycStatus === 'verified' && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px] px-2 py-0">
                    <ShieldCheck className="w-3 h-3 mr-1 inline" /> Verified
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-foreground">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <p className={`text-sm font-bold ${
                !isCurrentVariantAvailable 
                  ? 'text-red-500' 
                  : globalStock < 10 
                    ? 'text-amber-500' 
                    : 'text-green-600'
              }`}>
                {!isCurrentVariantAvailable 
                  ? '✕ Out of Stock' 
                  : globalStock < 10 
                    ? `⚠️ Low Stock: Only ${globalStock} kg left` 
                    : '✓ In Stock'}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground tracking-tight">Rs. {displayPrice}</span>
              <span className="text-lg text-muted-foreground font-medium">/ {selectedVariant ? selectedVariant.label : product.unit}</span>
            </div>
            <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
          </div>

          {/* Variants Selection */}
          {sortedVariants.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select Available Weight</Label>
              <div className="flex flex-wrap gap-3">
                {sortedVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`min-w-[80px] px-4 py-2 rounded-xl border-2 transition-all duration-200 font-bold ${
                      selectedVariant?.id === v.id 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-secondary/20 text-muted-foreground border-transparent hover:border-muted'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-secondary/10 p-4 text-center border border-secondary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Quality Assured</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-secondary/10 p-4 text-center border border-secondary/20">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-secondary/10 p-4 text-center border border-secondary/20">
                <RotateCcw className="h-6 w-6 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Service Availability Card */}
          {settingsLoading ? (
            <div className="animate-pulse flex space-x-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : sellerSettings ? (
            <Card className="border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="p-4 space-y-4">
                {/* Header: Location & Change Action */}
                <div className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px] mb-0.5">Delivering to:</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {fullLocationDetails.village || fullLocationDetails.city || 'Chebrolu'} {fullLocationDetails.pincode || '522212'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors underline hover:no-underline shrink-0 text-xs"
                  >
                    [Change Location]
                  </button>
                </div>

                {/* Status Row */}
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                    isDeliverable ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {isDeliverable ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-black tracking-tight ${isDeliverable ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {isDeliverable ? '✅ Delivery Available' : '❌ Delivery Not Available'}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {isDeliverable 
                        ? 'Your address falls within the seller\'s active delivery zone.' 
                        : 'Outside seller coverage area.'}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px] mb-0.5">Estimated Delivery:</span>
                    <span className={`font-extrabold ${isDeliverable ? 'text-slate-800' : 'text-slate-400'}`}>
                      {isDeliverable ? estimatedTime : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px] mb-0.5">Shipping Fee:</span>
                    <span className={`font-extrabold ${isDeliverable ? 'text-slate-800' : 'text-slate-400'}`}>
                      {isDeliverable ? shippingCharge : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px] mb-0.5">Distance:</span>
                    <span className="font-extrabold text-slate-800">
                      {distance ? `${distance.toFixed(1)} KM` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-tight text-[9px] mb-0.5">Seller Coverage:</span>
                    <span className="font-extrabold text-slate-800">
                      {sellerSettings ? `${sellerSettings.radius_km} KM Radius` : '--'}
                    </span>
                  </div>
                </div>

                {/* Seller Minimum Order Alert */}
                {isDeliverable && sellerSettings?.min_order_amount > 0 && (
                  <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center">
                    Min. Order Value for Seller: Rs. {sellerSettings.min_order_amount}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="border border-slate-200 rounded-2xl p-6 bg-slate-50 text-center space-y-3 shadow-sm">
              <MapPin className="h-8 w-8 text-slate-400 mx-auto animate-bounce" />
              <div>
                <p className="text-sm font-bold text-slate-800">Set location to check delivery availability</p>
                <p className="text-xs text-slate-400 mt-1">Please select your delivery address to see estimated charges and delivery timings.</p>
              </div>
              <Button 
                onClick={() => setIsLocationModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 px-4"
              >
                Set Delivery Location
              </Button>
            </Card>
          )}

          <div className="mt-auto flex items-center gap-4">
            {quantity === 0 ? (
              <Button 
                size="lg" 
                className="flex-1 h-14 text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                onClick={() => addToCart(product, 1, selectedVariant)}
                disabled={!isCurrentVariantAvailable}
              >
                {!isCurrentVariantAvailable ? 'Sold Out' : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-4 flex-1 h-14 rounded-xl border bg-background px-4 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-secondary"
                  onClick={() => {
                    if (quantity === 1) {
                      removeFromCart(currentItemKey)
                    } else {
                      updateQuantity(currentItemKey, quantity - 1)
                    }
                  }}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="flex-1 text-center text-xl font-bold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-secondary"
                  onClick={() => {
                    if (quantity < currentStock) {
                      updateQuantity(currentItemKey, quantity + 1)
                    }
                  }}
                  disabled={quantity >= currentStock}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 rounded-xl"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Recommendations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Recommended Products</h2>
        <ProductGrid filter="all" />
      </div>

      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </div>
  )
}
