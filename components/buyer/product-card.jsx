'use client'

import { useState } from 'react'
import { Plus, Minus, Leaf, Heart, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart-context'
import { useLocation } from '@/lib/location-context'
export function ProductCard({ product }) {
  const { cart, addToCart, updateQuantity, removeFromCart, wishlist, toggleWishlist } = useCart()
  const { isAllowed, detectedCity } = useLocation()
  // Helper function to get numeric weight from label (e.g., "250g" -> 250, "1kg" -> 1000)
  const getWeightFromLabel = (label) => {
    if (!label) return 0;
    const str = label.toLowerCase();
    const num = parseFloat(str) || 0;
    if (str.includes('kg') || str.includes('kilo')) return num * 1000;
    if (str.includes('ton')) return num * 1000000;
    return num;
  };

  const sortedVariants = product.variants ? [...product.variants].sort((a, b) => 
    getWeightFromLabel(a.label) - getWeightFromLabel(b.label)
  ) : [];

  const [selectedVariant, setSelectedVariant] = useState(sortedVariants.length > 0 ? sortedVariants[0] : null)
  
  const isLiked = wishlist.includes(product.id)
  
  const displayPrice = selectedVariant ? selectedVariant.price : product.basePrice
  const globalStock = parseFloat(product.stockQty || product.stock || 0)
  const currentStock = globalStock // Use global stock for all checks
  
  const currentItemKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id
  const cartItem = cart.items.find((item) => item.cartItemId === currentItemKey)
  const quantity = cartItem?.quantity || 0

  const isAvailable = globalStock > 0
  const isCurrentVariantAvailable = globalStock > 0
  const isServiceable = isAllowed !== false

  return (
    <Card className="group relative overflow-hidden border-0 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[1.2/1] overflow-hidden bg-secondary/20">
          {product.images?.[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold text-primary/40 uppercase">
                  {product.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
          
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex flex-col gap-1 sm:gap-1.5">
            {!isAvailable ? (
              <Badge variant="destructive" className="text-[8px] sm:text-[10px] px-1.5 sm:px-2.5 py-0 font-bold uppercase tracking-wider">
                Sold Out
              </Badge>
            ) : globalStock < 10 ? (
              <Badge className="bg-amber-500 text-white border-0 text-[8px] sm:text-[10px] px-1.5 sm:px-2.5 py-0 font-bold uppercase tracking-wider">
                Low Stock
              </Badge>
            ) : null}
            {product.isOrganic && (
              <Badge variant="secondary" className="gap-1 bg-green-500 text-white border-0 text-[8px] sm:text-[10px] px-1.5 sm:px-2.5 py-0 font-bold uppercase tracking-wider">
                <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Organic
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Like Button */}
      <button 
        onClick={() => toggleWishlist(product.id)}
        className={`absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border bg-white/90 shadow-md backdrop-blur-sm transition-all hover:scale-110 active:scale-95 ${
          isLiked ? 'text-red-500 border-red-100' : 'text-muted-foreground border-slate-100'
        }`}
      >
        <Heart className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${isLiked ? 'fill-current' : ''}`} />
      </button>

      <div className="p-2.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5 sm:mb-1">
              {product.categoryName}
            </p>
            <Link href={`/product/${product.id}`}>
              <h3 className="truncate text-xs sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {product.name}
              </h3>
            </Link>
          </div>
          <div className="flex items-baseline sm:flex-col sm:items-end gap-1.5 sm:gap-0 shrink-0">
             <span className="text-sm sm:text-lg font-black text-foreground">
              Rs. {displayPrice}
            </span>
            <span className="text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">/ {selectedVariant ? selectedVariant.label : product.unit}</span>
          </div>
        </div>
        
        {/* Compact Variants Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-2.5 sm:mt-4">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {sortedVariants.map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariant(v);
                  }}
                  className={`text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border transition-all duration-200 uppercase tracking-tight ${
                    selectedVariant?.id === v.id 
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                      : 'bg-secondary/40 text-muted-foreground border-transparent hover:border-muted hover:bg-secondary/60'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 sm:mt-5">
          {quantity === 0 ? (
            !isServiceable ? (
              <Button
                className="w-full h-9 sm:h-11 gap-1.5 sm:gap-2.5 bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-100"
                disabled
              >
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Not serviceable
              </Button>
            ) : (
              <Button
                className={`w-full h-9 sm:h-11 gap-1.5 sm:gap-2.5 text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                  isCurrentVariantAvailable 
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20' 
                  : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => addToCart(product, 1, selectedVariant)}
                disabled={!isCurrentVariantAvailable}
              >
                {!isCurrentVariantAvailable ? 'Sold Out' : (
                  <>
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                    Add to Cart
                  </>
                )}
              </Button>
            )
          ) : (
            <div className="flex items-center justify-between w-full h-9 sm:h-11 rounded-full border-2 border-primary/20 bg-white shadow-lg shadow-primary/5 p-1 animate-in zoom-in-95 duration-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                onClick={() => {
                  if (quantity === 1) {
                    removeFromCart(currentItemKey)
                  } else {
                    updateQuantity(currentItemKey, quantity - 1)
                  }
                }}
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
              </Button>
              <div className="flex flex-col items-center">
                <span className="text-[11px] sm:text-sm font-black text-primary leading-none">{quantity}</span>
                <span className="text-[7px] sm:text-[9px] font-bold text-primary/60 uppercase tracking-tighter leading-none mt-0.5">Added</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                onClick={() => {
                  if (quantity < currentStock) {
                    updateQuantity(currentItemKey, quantity + 1)
                  }
                }}
                disabled={quantity >= currentStock}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}





