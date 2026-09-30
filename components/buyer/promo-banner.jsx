'use client'

import { ArrowRight, Truck, Shield, Clock, MessageCircle, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from '@/lib/location-context'

export function PromoBanner() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-emerald-950/10 md:p-8 lg:p-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.30),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(251,146,60,0.24),transparent_28%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-emerald-900/40 to-transparent" />
      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100">
          <Sparkles className="h-3.5 w-3.5 text-orange-300" />
          Farm fresh marketplace
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
          Fresh produce from farms, delivered straight to you.
        </h1>
        <p className="mt-4 text-sm font-semibold leading-7 text-emerald-50/80 md:text-base">
          Shop vegetables, fruits, grains, and organic essentials. We ensure quality and prompt delivery.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            className="h-12 rounded-xl bg-white px-8 font-black text-emerald-900 hover:bg-emerald-50"
            onClick={() => document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

export function BulkOrderBanner() {
  const whatsappMessage = 'Hi AgroBridge, I want to place a bulk order. Please share pricing and availability.'
  const whatsappUrl = `https://wa.me/918008181429?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-amber-50 p-6 shadow-sm md:p-8">
      <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
          <Truck className="h-8 w-8" />
        </div>
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h2 className="text-xl font-black text-orange-900 md:text-2xl">Need Bulk Supplies?</h2>
          <p className="max-w-2xl text-sm font-medium text-orange-800/80 md:text-base">
            Running a restaurant, hotel, or retail shop? We provide fresh bulk produce directly from farms with custom pricing and priority coordination.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="h-12 rounded-xl bg-orange-600 px-8 font-black text-white shadow-lg shadow-orange-200 hover:bg-orange-700"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact for Bulk Order
          </a>
        </Button>
      </div>

      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-orange-200/30" />
      <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-orange-200/30" />
    </section>
  )
}

export function FeatureBanner() {
  const features = [
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'On orders above Rs. 500',
    },
    {
      icon: Shield,
      title: 'Quality Assured',
      description: 'Farm fresh guarantee',
    },
    {
      icon: Clock,
      title: 'Express Delivery',
      description: 'Same day in active zones',
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-3">
      {features.map((feature, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <feature.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">{feature.title}</p>
            <p className="text-xs font-semibold text-muted-foreground">{feature.description}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
