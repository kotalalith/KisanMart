'use client'

import { useProducts } from '@/lib/product-context'
import { ProductCard } from './product-card'

export function ProductGrid({ title, filter = 'all', categoryId, limit }) {
  const { products, loading } = useProducts()
  
  if (loading) {
    return (
      <section className="py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[0.8/1] rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  let filteredProducts = products

  if (categoryId) {
    filteredProducts = products.filter((p) => p.categoryId === categoryId)
  } else if (filter === 'featured') {
    filteredProducts = products.filter((p) => p.isFeatured)
  } else if (filter === 'organic') {
    filteredProducts = products.filter((p) => p.isOrganic)
  }

  if (limit) {
    filteredProducts = filteredProducts.slice(0, limit)
  }

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <button className="text-sm font-medium text-primary hover:underline">
          View All
        </button>
      </div>
      <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}





