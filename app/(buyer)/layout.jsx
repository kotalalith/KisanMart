'use client'

import { BuyerHeader } from '@/components/buyer/header'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, ShoppingCart, Package, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { cn } from '@/lib/utils'

export default function BuyerLayout({ children }) {
  const pathname = usePathname()
  const { itemCount } = useCart()

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Products', icon: ShoppingBag, href: '/categories' },
    { label: 'Cart', icon: ShoppingCart, href: '/cart', showBadge: true },
    { label: 'Orders', icon: Package, href: '/orders' },
    { label: 'Profile', icon: User, href: '/profile' }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      <BuyerHeader />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>

      {/* App-Like Mobile Bottom Navigation Bar (hidden on desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden h-16 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-500 active:scale-95 transition-transform relative"
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-emerald-50 text-emerald-600 font-bold scale-105" : "hover:bg-slate-50"
              )}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              <span className={cn(
                "text-[9px] font-bold tracking-tight uppercase text-center transition-colors",
                isActive ? "text-emerald-700" : "text-slate-400"
              )}>
                {item.label}
              </span>

              {/* Cart Items Badge */}
              {item.showBadge && itemCount > 0 && (
                <span className="absolute top-1 right-[24%] bg-emerald-600 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

