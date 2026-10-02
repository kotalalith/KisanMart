'use client'

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CategoryGrid } from '@/components/buyer/category-grid'
import { ProductCard } from '@/components/buyer/product-card'
import { useCategories } from '@/lib/category-context'
import { useProducts } from '@/lib/product-context'
import { Input } from '@/components/ui/input'
import { Search, SlidersHorizontal, PackageOpen } from 'lucide-react'

function CategoriesContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [, startTransition] = useTransition()

  const { categories } = useCategories()
  const { products, loading: productsLoading } = useProducts()

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory)

  // Filter products by selected category and search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true
    const query = searchTerm.toLowerCase().trim()
    const matchesSearch = query
      ? (product.name && product.name.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query))
      : true

    return matchesCategory && matchesSearch
  })

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-6 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50/60 border border-emerald-100 p-5 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {activeCategoryObj ? activeCategoryObj.name : 'Explore All Categories & Products'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse fresh organic produce, pulses, grains, and farm goods directly from local farmers.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value
              startTransition(() => setSearchTerm(val))
            }}
            className="pl-9 bg-white border-slate-200 focus-visible:ring-emerald-500 rounded-xl"
          />
        </div>
      </div>

      {/* Category selector grid */}
      <CategoryGrid onSelect={setSelectedCategory} selectedId={selectedCategory} />

      {/* Product List Header */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-700">
            Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
            {selectedCategory && activeCategoryObj ? ` in ${activeCategoryObj.name}` : ''}
            {searchTerm ? ` matching "${searchTerm}"` : ''}
          </span>
        </div>

        {(selectedCategory || searchTerm) && (
          <button
            onClick={() => {
              setSelectedCategory(null)
              setSearchTerm('')
            }}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[0.8/1] rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <PackageOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-700">No products found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            We couldn't find any products matching your current criteria. Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-10 w-64 bg-slate-100 animate-pulse rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <CategoriesContent />
    </Suspense>
  )
}
