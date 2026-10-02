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

  const handlePickCity = (cityName, lat, lng) => {
    const detail = {
      village: cityName + ' Central',
      city: cityName,
      district: cityName,
      state: 'Active Hub',
      pincode: '',
      lat,
      lng
    }
    setManualLocation({
      id: `zone-${cityName.toLowerCase().replace(/\s+/g, '')}`,
      city_name: cityName,
      center_lat: lat,
      center_lng: lng,
      radius_km: 50,
      is_active: true
    })
    setShowPopup(false)
  }

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-md px-4 py-8 overflow-y-auto animate-in fade-in duration-300">
          <div className="w-full max-w-md mx-auto bg-slate-900 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>

            {/* Decorative element */}
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 text-center space-y-5">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <MapPin className="h-6 w-6 text-emerald-400" />
              </div>
              
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Limited Service Area
                </h2>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Fast farm delivery is active in select cities. Detected: <span className="text-emerald-400 font-semibold">{detectedCity || "your area"}</span>.
                </p>
              </div>

              {/* Quick Hub Selector */}
              <div className="space-y-2 pt-1 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Or switch to an active delivery hub:
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    { name: 'Guntur', lat: 16.3067, lng: 80.4365 },
                    { name: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
                    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
                    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
                    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
                    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 }
                  ].map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => handlePickCity(city.name, city.lat, city.lng)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-emerald-600 text-white border border-white/10 transition-colors"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Enter Pincode or Search Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="w-full h-10 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 transition-colors"
                >
                  Browse Marketplace Anyway
                </button>
              </div>

              {/* Waitlist Form */}
              <div className="pt-3 border-t border-white/10">
                {submitted ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-1">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-white">You're on the early access list!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Join waitlist for your area:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Your Phone Number"
                        type="tel"
                        required
                        className="h-9 bg-white/5 border-white/10 text-white text-xs placeholder:text-slate-500 rounded-lg"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        size="sm" 
                        className="h-9 px-4 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Notify Me'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </>
  )
}
