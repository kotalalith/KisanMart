'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '@/lib/product-context'
import { ProductCard } from '@/components/buyer/product-card'
import { BuyerHeader } from '@/components/buyer/header'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Truck, PackageCheck, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BulkOrdersPage() {
  const { products, loading } = useProducts()
  const [showWelcome, setShowWelcome] = useState(false)
  
  // Show welcome message on mount
  useEffect(() => {
    setShowWelcome(true)
  }, [])

  // Only show products that are explicitly marked as bulk
  const bulkProducts = products.filter(p => p.isBulk)

  return (
    <div className="min-h-screen bg-[#f8fafc] -mt-6">
      <main className="py-2">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-6 transition-colors group">
          <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to Retail Shop
        </Link>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] p-10 md:p-16 mb-12 text-white shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 mb-6">
              <PackageCheck className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Premium B2B Wholesale</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              Wholesale <br/>
              <span className="text-orange-500 italic">Redefined.</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg md:text-xl leading-relaxed max-w-2xl">
              Connect directly with high-capacity farms. We streamline the supply chain for restaurants, retailers, and exporters with guaranteed quality.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-6">
              <Button className="h-14 px-10 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-xl shadow-orange-900/20 transition-all hover:scale-105">
                Apply for Wholesale Account
              </Button>
              <div className="flex items-center gap-3 text-slate-400">
                <div className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center">
                   <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-sm font-bold">100% Quality Guaranteed</span>
              </div>
            </div>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />
          <div className="absolute right-20 bottom-10 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
        </div>

        {/* Bulk Products Section */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Wholesale Inventory</h2>
              <p className="text-slate-500 font-medium">Exclusive pricing for bulk purchases (Min 100kg)</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border shadow-sm text-sm font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live Inventory
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="aspect-[0.8/1] rounded-[2rem] bg-white border animate-pulse shadow-sm" />
              ))}
            </div>
          ) : bulkProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {bulkProducts.map(product => (
                <ProductCard key={product.id} product={{...product, isBulkView: true}} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
              <div className="mx-auto h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300 flex mb-6">
                <Truck className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">No Wholesale Items Currently Listed</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">
                Sellers haven't listed any bulk-specific inventory yet. Please check back later or contact us for custom sourcing.
              </p>
              <Button variant="outline" className="mt-8 h-12 px-8 rounded-xl font-bold border-slate-200 hover:bg-slate-50">
                Contact Sourcing Team
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-orange-600 p-8 text-white text-center">
            <div className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <PackageCheck className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black">Welcome to Bulk Orders!</DialogTitle>
            <DialogDescription className="text-orange-100 font-medium mt-2">
              You are now entering our Wholesale B2B Marketplace.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Verified Quality</p>
                  <p className="text-sm text-slate-500">Every batch is inspected for farm-fresh quality standards.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Custom Logistics</p>
                  <p className="text-sm text-slate-500">We handle large-scale deliveries to your business location.</p>
                </div>
              </div>
            </div>
            <Button 
              className="w-full h-12 bg-[#0f172a] text-white hover:bg-slate-800 rounded-xl font-bold uppercase tracking-widest transition-all"
              onClick={() => setShowWelcome(false)}
            >
              Start Sourcing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
