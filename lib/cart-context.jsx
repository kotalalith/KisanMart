'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useUser } from './user-context'
import { useLocation } from './location-context'
import { toast } from 'sonner'

const CartContext = createContext(undefined)

const DELIVERY_FEE = 40
const TAX_RATE = 0.05

function calculateCart(items, appliedCoupon, userProfile) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const deliveryFee = subtotal > 500 ? 0 : DELIVERY_FEE
  
  let discount = 0
  let referralDiscountApplied = false

  if (userProfile?.referredBy && userProfile?.firstOrderDiscountEligible && subtotal >= 300) {
    discount = 100
    referralDiscountApplied = true
  } else if (appliedCoupon && subtotal >= appliedCoupon.minOrder) {
    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100
    } else {
      discount = appliedCoupon.value
    }
    if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
      discount = appliedCoupon.maxDiscount
    }
  }

  const total = Math.max(0, subtotal + tax + deliveryFee - discount)

  return {
    items,
    subtotal,
    deliveryFee,
    tax,
    discount,
    total,
    appliedCoupon: referralDiscountApplied ? null : (subtotal >= (appliedCoupon?.minOrder || 0) ? appliedCoupon : null),
    referralDiscountApplied,
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { wishlist, toggleWishlist, userProfile } = useUser()
  const { isAllowed, detectedCity } = useLocation()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('agro_cart_items')
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems))
      } catch (e) {
        console.error("Failed to load cart items:", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('agro_cart_items', JSON.stringify(items))
    }
  }, [items, isLoaded])

  const addToCart = useCallback((product, quantity = 1, variant = null) => {
    if (isAllowed === false) {
      toast.error(`Delivery is not available in ${detectedCity || 'your area'}.`)
      return false
    }

    setItems((prev) => {
      const itemKey = variant ? `${product.id}-${variant.id}` : product.id
      const existing = prev.find((item) => item.cartItemId === itemKey)
      
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      
      return [
        ...prev,
        {
          id: `cart-${itemKey}-${Date.now()}`,
          cartItemId: itemKey,
          productId: product.id,
          variantId: variant?.id || null,
          variantLabel: variant?.label || null,
          variantWeight: variant?.weight || 1,
          product,
          quantity,
          pricePerUnit: variant ? parseFloat(variant.price) : product.basePrice,
        },
      ]
    })
    return true
  }, [isAllowed, detectedCity])

  const removeFromCart = useCallback((cartItemId) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
  }, [])

  const updateQuantity = useCallback((cartItemId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId))
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        )
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setAppliedCoupon(null)
  }, [])

  const applyCoupon = useCallback((coupon) => {
    setAppliedCoupon(coupon)
  }, [])

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null)
  }, [])

  const cart = calculateCart(items, appliedCoupon, userProfile)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    wishlist,
    toggleWishlist,
    applyCoupon,
    removeCoupon,
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, wishlist, toggleWishlist, applyCoupon, removeCoupon])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}






