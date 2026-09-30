'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCircle, Shield, Truck, ShoppingBag, RefreshCcw } from 'lucide-react'

export default function DevIdentitySwitcher() {
  const { userProfile, switchIdentity } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleReset = () => {
    if (confirm("This will clear your local session and redirect to home. Continue?")) {
      localStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="rounded-full shadow-2xl bg-slate-900 hover:bg-black gap-2 font-black text-[10px] tracking-widest uppercase h-10 px-4">
            <UserCircle className="h-4 w-4" />
            Identity: {userProfile?.role || 'Switch'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 rounded-3xl p-3 mb-2 shadow-2xl border-none bg-white/90 backdrop-blur-xl">
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 p-2">Switch Role (Dev Mode)</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100" />
          
          <DropdownMenuItem onClick={() => switchIdentity('buyer-123')} className="rounded-xl flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-50 transition-colors">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Buyer (lalli)</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => switchIdentity('seller-1')} className="rounded-xl flex items-center gap-3 p-3 cursor-pointer hover:bg-emerald-50 transition-colors">
            <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Seller (Farmer)</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => switchIdentity('delivery-1')} className="rounded-xl flex items-center gap-3 p-3 cursor-pointer hover:bg-amber-50 transition-colors">
            <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              <Truck className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Delivery Partner</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => switchIdentity('admin-1')} className="rounded-xl flex items-center gap-3 p-3 cursor-pointer hover:bg-purple-50 transition-colors">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-xs">Admin Panel</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        onClick={handleReset}
        variant="outline" 
        size="icon" 
        className="rounded-full h-10 w-10 bg-white border-2 border-slate-100 text-red-500 hover:bg-red-50 shadow-xl"
        title="Reset All Data & Session"
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  )
}
