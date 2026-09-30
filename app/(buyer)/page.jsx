'use client'

import { useState } from 'react'
import { PromoBanner, FeatureBanner, BulkOrderBanner } from '@/components/buyer/promo-banner'
import { CategoryGrid } from '@/components/buyer/category-grid'
import { ProductGrid } from '@/components/buyer/product-grid'
import { useCategories } from '@/lib/category-context'

export default function MarketplaceHomePage() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const { categories } = useCategories()
  
  const categoryName = categories.find(c => c.id === selectedCategory)?.name

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-b-[2.5rem] bg-gradient-to-b from-emerald-50 via-white to-white px-3 pb-2 pt-4 sm:px-4">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="space-y-4">
            <PromoBanner />
            <FeatureBanner />
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl space-y-8 px-3 sm:px-4">
        <CategoryGrid onSelect={setSelectedCategory} selectedId={selectedCategory} />
      
        {selectedCategory ? (
          <ProductGrid title={`${categoryName} Products`} categoryId={selectedCategory} />
        ) : (
          <>
            <div id="featured-products">
              <ProductGrid title="Featured Products" filter="featured" limit={5} />
            </div>
            <BulkOrderBanner />
            <ProductGrid title="Organic & Natural" filter="organic" limit={5} />
            <ProductGrid title="All Products" filter="all" />
          </>
        )}
      </div>
    </div>
  )
}
