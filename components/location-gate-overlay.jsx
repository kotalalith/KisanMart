'use client'

import { useState, useEffect } from 'react'
import { useLocation } from '@/lib/location-context'
import { useRole } from '@/lib/role-context'
import { MapPin, CheckCircle2, Loader2, Phone, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocationModal } from '@/components/buyer/location-modal'

import { usePathname } from 'next/navigation'

export function LocationGateOverlay() {
  const { isAllowed, isChecking, addToWaitlist, detectedCity, zones, setManualLocation, refreshLocation } = useLocation()
  const { role } = useRole()
  const pathname = usePathname()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  const activeZones = zones.filter(z => z.is_active)

  // Skip gating for essential system routes
  const isExcludedPath = 
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/seller') || 
    pathname?.startsWith('/roles') || 
    pathname?.startsWith('/login') || 
    pathname?.startsWith('/signup') || 
    pathname?.startsWith('/profile') ||
    pathname === '/coming-soon'

  // Show quickly once the location check confirms the area is outside active zones.
  useEffect(() => {
    if (role === 'buyer' && !isExcludedPath && isAllowed === false && !isChecking) {
      const timer = setTimeout(() => {
        setShowPopup(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else {
      setShowPopup(false)
    }
  }, [isAllowed, isChecking, role, isExcludedPath])

  if (!showPopup) {
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      addToWaitlist({
        name,
        phone,
        city_detected: detectedCity || 'Unknown Area'
      })
      setIsLoading(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md px-4 py-8 overflow-y-auto animate-in fade-in duration-700">
      <div className="w-full max-w-md mx-auto bg-slate-900 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 delay-150">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <MapPin className="h-6 w-6 text-emerald-500 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Service Not Available Yet
            </h2>
            <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              AgroBridge normal delivery is not active in <span className="text-orange-300 font-semibold">{detectedCity || "your area"}</span>.
            </p>
          </div>

          <div className="py-2">
            <button 
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <MapPin className="h-4 w-4 text-emerald-400" />
              Enter Pincode or Select on Map
            </button>
          </div>

          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Product ordering and checkout are blocked for this location. Please select a serviceable location or join the waitlist.
          </p>

          <div className="py-2">
            {submitted ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 space-y-4 animate-in zoom-in-95 duration-500">
                <div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">You're on the list!</h3>
                  <p className="text-slate-400 text-sm">
                    We'll notify you via SMS as soon as we launch here.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                      placeholder="Your Full Name"
                      required
                      className="h-12 pl-12 bg-white/5 border-white/10 text-white text-sm placeholder:text-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                      placeholder="Mobile Number"
                      type="tel"
                      required
                      className="h-12 pl-12 bg-white/5 border-white/10 text-white text-sm placeholder:text-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'GET EARLY ACCESS'
                  )}
                </Button>
              </form>
            )}
          </div>

          <div className="pt-6 space-y-4 border-t border-white/5">
            <button 
              className="text-slate-500 hover:text-emerald-400 gap-2 transition-colors text-xs font-bold flex items-center justify-center mx-auto"
              onClick={() => refreshLocation()}
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              Retry Auto-Detect
            </button>
            
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-relaxed">
                Location is outside current delivery zones. <br/> 
                Select an active city or retry detection.
              </p>
            </div>
          </div>
        </div>
      </div>
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </div>
  )
}
