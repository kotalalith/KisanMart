'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Truck, Lock, Mail, ChevronRight, Fingerprint } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function DeliveryLogin() {
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      return toast.error("Please fill in all fields")
    }

    setIsLoggingIn(true)
    const toastId = toast.loading("Verifying credentials...")
    
    try {
      // Simulate API call and verify credentials
      // We use the 'dl-' prefix to ensure it lands in the delivery_partners collection
      const emailPrefix = formData.email.split('@')[0]
      const simulatedUid = `dl-${emailPrefix}`
      
      // Manually set the test UID and redirect immediately
      // This avoids the reload loop caused by switchIdentity
      localStorage.setItem('agro_test_uid', simulatedUid)
      
      setTimeout(() => {
        toast.success("Welcome back, Partner!", { id: toastId })
        // Hard redirect to dashboard to ensure fresh state
        window.location.href = '/delivery'
      }, 800)

    } catch (error) {
      console.error("Login Error:", error)
      toast.error("Login failed. Please check your credentials.", { id: toastId })
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden">
        <div className="h-2 bg-slate-900 w-full"></div>
        
        <CardHeader className="pt-10 pb-6 text-center space-y-2">
           <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-lg shadow-slate-50">
              <Truck className="h-8 w-8" />
           </div>
           <CardTitle className="text-3xl font-black tracking-tighter text-slate-900">Partner Login</CardTitle>
           <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Access your delivery dashboard</CardDescription>
        </CardHeader>

        <CardContent className="px-10 py-6">
           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</Label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      type="email"
                      placeholder="delivery@agrobridge.com" 
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 font-bold" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                    />
                 </div>
              </div>
              
              <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Password</Label>
                    <button type="button" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Forgot?</button>
                 </div>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 font-bold" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required
                    />
                 </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 group transition-all mt-4"
              >
                 {isLoggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
                 <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
           </form>

           <div className="mt-8 flex items-center gap-4 py-4 px-2 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Fingerprint className="h-6 w-6 text-emerald-600" />
              <p className="text-[10px] text-emerald-800 font-bold leading-relaxed italic">Protected by AgroBridge Security. Please do not share your credentials.</p>
           </div>
        </CardContent>

        <CardFooter className="px-10 pb-10 pt-2 text-center flex flex-col gap-4">
           <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">New to the platform?</p>
           <Link href="/delivery/signup" className="w-full">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
                 Apply for Partner Account
              </Button>
           </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
