'use client'

import { useState } from 'react'
import { MapPin, Phone, User, CheckCircle2, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ComingSoonPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [detectedCity, setDetectedCity] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  const refreshLocation = () => {
    // Logic for refreshing location would go here
    window.location.reload()
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#050A10] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 flex flex-col items-center text-center space-y-8 py-12">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <div className="relative h-20 w-20 rounded-2xl bg-card border border-primary/20 flex items-center justify-center shadow-2xl">
            <MapPin className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Coming <span className="text-primary italic">Soon!</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-md mx-auto leading-relaxed">
            AgroBridge is not yet active in <span className="text-primary font-semibold underline underline-offset-4 decoration-primary/30">your area</span>.
          </p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            We're building the future of farm-to-table. Join the waitlist to be first in line when we launch.
          </p>
        </div>

        {/* Waitlist Form */}
        <Card className="w-full bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Get Early Access</CardTitle>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="flex flex-col items-center py-8 space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">You're on the list!</h3>
                  <p className="text-slate-400 text-sm mt-1">We'll notify you as soon as we arrive in {detectedCity || 'your city'}.</p>
                </div>
                <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={() => setIsSubmitted(false)}>
                  Back
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 py-2">
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Your Full Name" 
                      className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:ring-primary focus:border-primary"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Mobile Number" 
                      type="tel"
                      className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:ring-primary focus:border-primary"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <Button className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-[1.02] active:scale-95" type="submit">
                  JOIN WAITLIST
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer Link */}
        <button 
          onClick={refreshLocation}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium group"
        >
          <RefreshCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          Not in this area? Retry Location
        </button>
      </div>
    </div>
  )
}
