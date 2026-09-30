'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Truck, ShieldCheck, ChevronRight, FileText, Camera, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

export default function DeliverySignup() {
  const router = useRouter()
  const { switchIdentity } = useUser()
  const [step, setStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    vehicleType: 'Mini Truck (TATA Ace)',
    vehicleNumber: '',
    licenseUrl: '',
    rcUrl: '',
    selfieUrl: ''
  })

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const toastId = toast.loading(`Uploading document...`)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'delivery-kyc')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      const data = await res.json()
      if (data.url) {
        setFormData(prev => ({ ...prev, [field]: data.url }))
        toast.success("Uploaded successfully!", { id: toastId })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast.error("Upload failed. Please check S3 config.", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSignup = async () => {
    if (!formData.selfieUrl || !formData.licenseUrl || !formData.rcUrl) {
      return toast.error("Please upload all required documents")
    }

    setIsSubmitting(true)
    const toastId = toast.loading("Creating partner account...")
    
    try {
      // FORCE prefix 'dl-' to ensure UserContext finds it in delivery_partners collection
      const emailPrefix = formData.email ? formData.email.split('@')[0] : Math.random().toString(36).substring(7)
      const simulatedUid = `dl-${emailPrefix}`
      
      const partnerData = {
        ...formData,
        role: 'delivery',
        kycStatus: 'pending',
        status: 'inactive',
        walletBalance: 0,
        deliveryId: `AGRO-DL-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
      }

      // Save to delivery_partners collection
      await setDoc(doc(db, "delivery_partners", simulatedUid), partnerData)
      
      // Important: Use window.location.href to redirect instead of switchIdentity's internal reload
      // This ensures we land on the dashboard with a clean state
      localStorage.setItem('agro_test_uid', simulatedUid)
      toast.success("Account created! Welcome to the team.", { id: toastId })
      
      setTimeout(() => {
        window.location.href = '/delivery'
      }, 1000)

    } catch (e) {
      console.error(e)
      toast.error("Signup failed. Please try again.", { id: toastId })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <Card className="max-w-xl w-full border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden">
        <div className="h-2 bg-emerald-600 w-full flex">
           <div className={`h-full bg-emerald-400 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>
        
        <CardHeader className="pt-10 pb-6 text-center space-y-2">
           <div className="h-16 w-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-lg shadow-emerald-50">
              <Truck className="h-8 w-8" />
           </div>
           <CardTitle className="text-3xl font-black tracking-tighter">Become a Partner</CardTitle>
           <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Step {step} of 3: {step === 1 ? 'Account Details' : step === 2 ? 'Vehicle Info' : 'Document Verification'}</CardDescription>
        </CardHeader>

        <CardContent className="px-10 py-6">
           {step === 1 && (
             <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</Label>
                   <Input 
                     placeholder="John Doe" 
                     className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Phone Number</Label>
                     <Input 
                       placeholder="+91 0000000000" 
                       className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" 
                       value={formData.phone}
                       onChange={e => setFormData({...formData, phone: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</Label>
                     <Input 
                       placeholder="john@example.com" 
                       className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" 
                       value={formData.email}
                       onChange={e => setFormData({...formData, email: e.target.value})}
                     />
                  </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Password</Label>
                   <Input 
                     type="password" 
                     className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold" 
                     value={formData.password}
                     onChange={e => setFormData({...formData, password: e.target.value})}
                   />
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vehicle Type</Label>
                   <select 
                     className="w-full h-14 rounded-2xl bg-slate-50 border-slate-100 px-4 font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-500/20"
                     value={formData.vehicleType}
                     onChange={e => setFormData({...formData, vehicleType: e.target.value})}
                   >
                      <option>Mini Truck (TATA Ace)</option>
                      <option>Pickup Truck (Bolero)</option>
                      <option>Bike (Express Delivery)</option>
                      <option>Heavy Truck (Inter-state)</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vehicle Plate Number</Label>
                   <Input 
                     placeholder="TS 09 AB 1234" 
                     className="h-14 rounded-2xl bg-slate-50 border-slate-100 uppercase font-bold" 
                     value={formData.vehicleNumber}
                     onChange={e => setFormData({...formData, vehicleNumber: e.target.value})}
                   />
                </div>
                <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 flex gap-4 items-center">
                   <ShieldCheck className="h-8 w-8 text-amber-600 flex-shrink-0" />
                   <p className="text-[11px] text-amber-800 font-bold leading-relaxed">Ensure all details are accurate as per your vehicle registration for fast approval.</p>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Driving License</Label>
                      <div className="relative h-32 w-full rounded-[1.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group overflow-hidden">
                         {formData.licenseUrl ? (
                           <img src={formData.licenseUrl} className="w-full h-full object-cover" />
                         ) : (
                           <>
                             <Camera className="h-6 w-6 text-slate-300 group-hover:text-emerald-500" />
                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-2">Upload Photo</span>
                           </>
                         )}
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, 'licenseUrl')} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vehicle RC Book</Label>
                      <div className="relative h-32 w-full rounded-[1.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group overflow-hidden">
                         {formData.rcUrl ? (
                           <img src={formData.rcUrl} className="w-full h-full object-cover" />
                         ) : (
                           <>
                             <FileText className="h-6 w-6 text-slate-300 group-hover:text-emerald-500" />
                             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-2">Upload Photo</span>
                           </>
                         )}
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, 'rcUrl')} />
                      </div>
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Live Selfie (Profile)</Label>
                   <div className="relative h-40 w-full rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group overflow-hidden">
                      {formData.selfieUrl ? (
                        <img src={formData.selfieUrl} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Smartphone className="h-8 w-8 text-slate-300 group-hover:text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 text-center">Take a clear selfie<br/>facing front</span>
                        </>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, 'selfieUrl')} />
                   </div>
                </div>
             </div>
           )}
        </CardContent>

        <CardFooter className="px-10 pb-10 pt-4 flex gap-4">
           {step > 1 && (
             <Button variant="ghost" disabled={isSubmitting} className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={() => setStep(step - 1)}>Back</Button>
           )}
           <Button 
             disabled={isSubmitting || isUploading}
             className="flex-grow h-14 rounded-2xl bg-slate-900 hover:bg-black font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 group transition-all"
             onClick={() => step < 3 ? setStep(step + 1) : handleSignup()}
           >
              {isSubmitting ? 'Processing...' : (step < 3 ? 'Continue' : 'Complete Registration')}
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
           </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
