'use client'

import { useState } from 'react'
import { 
  User, 
  ShieldCheck,
  Phone,
  Mail,
  Edit2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/user-context'

export default function ProfilePage() {
  const { userProfile, updateProfile, loading } = useUser()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || ''
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-lg shadow-emerald-500/20" />
      </div>
    )
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    await updateProfile(profileForm)
    setIsEditingProfile(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">My Account</h1>
          <p className="text-slate-500 font-medium">Manage your personal identity and contact details</p>
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Verified Profile
        </Badge>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-none shadow-2xl shadow-slate-200/80 bg-white/90 backdrop-blur-md overflow-hidden rounded-[32px]">
          <CardHeader className="border-b border-slate-50 pb-8 pt-10 px-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Personal Information</CardTitle>
                <CardDescription className="text-base font-medium text-slate-400">Your information is secure and private</CardDescription>
              </div>
              {!isEditingProfile && (
                <Button variant="outline" size="lg" onClick={() => setIsEditingProfile(true)} className="rounded-full font-black border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all px-8">
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-10">
            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                    <Input 
                      value={profileForm.name} 
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 font-bold text-lg px-6"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Phone Number</label>
                    <Input 
                      value={profileForm.phone} 
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 font-bold text-lg px-6"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                    <Input 
                      value={profileForm.email} 
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 font-bold text-lg px-6"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <Button type="submit" className="h-14 bg-emerald-600 hover:bg-emerald-700 rounded-full px-12 font-black text-lg shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95">Save Identity</Button>
                  <Button variant="ghost" type="button" onClick={() => setIsEditingProfile(false)} className="h-14 rounded-full px-8 font-black text-slate-500 hover:bg-slate-100">Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-10 md:grid-cols-3">
                <div className="flex flex-col gap-4 p-8 rounded-[24px] bg-emerald-50/30 border border-emerald-100/20 group hover:bg-emerald-50 transition-colors">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/60 mb-1">Display Name</p>
                    <p className="text-xl font-black text-slate-900">{userProfile?.name || 'Not Set'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-8 rounded-[24px] bg-blue-50/30 border border-blue-100/20 group hover:bg-blue-50 transition-colors">
                  <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700/60 mb-1">Mobile Number</p>
                    <p className="text-xl font-black text-slate-900">{userProfile?.phone || 'Not Set'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-8 rounded-[24px] bg-amber-50/30 border border-amber-100/20 group hover:bg-amber-50 transition-colors">
                  <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700/60 mb-1">Email ID</p>
                    <p className="text-xl font-black text-slate-900 break-all">{userProfile?.email || 'Not Set'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
