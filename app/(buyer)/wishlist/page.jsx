'use client'

import { useCart } from '@/lib/cart-context'
import { useProducts } from '@/lib/product-context'
import { ProductCard } from '@/components/buyer/product-card'
import { Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function BuyerWishlistPage() {
  const { wishlist } = useCart()
  const { products } = useProducts()
  
  const savedItems = products.filter((p) => wishlist.includes(p.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500 fill-current" />
        <h1 className="text-2xl font-bold text-foreground">Saved Items</h1>
      </div>

      {savedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-6">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
          <p className="mt-2 text-muted-foreground">
            Save items you like to find them easily later.
          </p>
          <Link href="/">
            <Button className="mt-6 gap-2">
              <ShoppingBag className="h-4 w-4" />
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {savedItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
