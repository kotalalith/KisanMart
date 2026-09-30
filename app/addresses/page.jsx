'use client'

import { useState } from 'react'
import { 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Home, 
  Briefcase, 
  Warehouse,
  ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/user-context'

export default function AddressesPage() {
  const { addresses, addAddress, deleteAddress, setAsDefaultAddress, loading } = useUser()
  const [showAddAddress, setShowAddAddress] = useState(false)
  
  // Address Form State
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-lg shadow-emerald-500/20" />
      </div>
    )
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    await addAddress(addressForm)
    setAddressForm({ label: 'Home', street: '', city: '', state: '', zip: '', isDefault: false })
    setShowAddAddress(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-12 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Manage Addresses</h1>
          <p className="text-slate-500 font-medium">Your saved locations for faster, reliable deliveries</p>
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-sm">
          <MapPin className="w-3.5 h-3.5 mr-1.5" /> Secure Vault
        </Badge>
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-6 rounded-[24px] border border-white/60">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">Add a new delivery point</p>
              <p className="text-sm font-medium text-slate-400">Register a new home, farm, or office address</p>
            </div>
          </div>
          <Button onClick={() => setShowAddAddress(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-full font-black px-10 h-12 shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95">
            New Address
          </Button>
        </div>

        {showAddAddress && (
          <Card className="border-none shadow-2xl shadow-emerald-500/10 bg-emerald-50/40 backdrop-blur-md rounded-[32px] animate-in zoom-in duration-500">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black text-emerald-900">Address Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleAddAddress} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/60 ml-1">Type of Place</label>
                    <select 
                      className="w-full h-14 rounded-2xl border-emerald-100 bg-white/80 px-6 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none shadow-sm"
                      value={addressForm.label}
                      onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                    >
                      <option>Home</option>
                      <option>Farm</option>
                      <option>Office</option>
                      <option>Warehouse</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/60 ml-1">Street Address</label>
                    <Input 
                      value={addressForm.street} 
                      onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                      className="h-14 rounded-2xl border-emerald-100 bg-white/80 font-bold px-6 shadow-sm"
                      placeholder="123 Main St, Area Name"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/60 ml-1">City / Town</label>
                    <Input 
                      value={addressForm.city} 
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      className="h-14 rounded-2xl border-emerald-100 bg-white/80 font-bold px-6 shadow-sm"
                      placeholder="Hyderabad"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700/60 ml-1">State & PIN Code</label>
                    <div className="flex gap-4">
                      <Input 
                        value={addressForm.state} 
                        onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                        className="h-14 rounded-2xl border-emerald-100 bg-white/80 font-bold px-6 w-1/2 shadow-sm"
                        placeholder="Telangana"
                      />
                      <Input 
                        value={addressForm.zip} 
                        onChange={(e) => setAddressForm({...addressForm, zip: e.target.value})}
                        className="h-14 rounded-2xl border-emerald-100 bg-white/80 font-bold px-6 w-1/2 shadow-sm"
                        placeholder="5000XX"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-emerald-100/30">
                  <Button type="submit" className="h-14 bg-emerald-600 hover:bg-emerald-700 rounded-full px-12 font-black text-lg shadow-xl shadow-emerald-600/30 transition-all hover:scale-105">Save Location</Button>
                  <Button variant="ghost" type="button" onClick={() => setShowAddAddress(false)} className="h-14 rounded-full px-8 font-black text-emerald-700 hover:bg-emerald-100/50">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id} className={`border-none shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-md overflow-hidden group transition-all hover:shadow-2xl hover:shadow-emerald-500/20 rounded-[28px] ${addr.isDefault ? 'ring-2 ring-emerald-500' : ''}`}>
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`h-16 w-16 rounded-[22px] flex items-center justify-center shadow-inner ${
                      addr.label === 'Home' ? 'bg-blue-100 text-blue-600' :
                      addr.label === 'Farm' ? 'bg-emerald-100 text-emerald-600' :
                      addr.label === 'Office' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {addr.label === 'Home' && <Home className="w-8 h-8" />}
                      {addr.label === 'Farm' && <Warehouse className="w-8 h-8" />}
                      {addr.label === 'Office' && <Briefcase className="w-8 h-8" />}
                      {addr.label === 'Warehouse' && <Warehouse className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-black text-slate-900">{addr.label}</p>
                        {addr.isDefault && (
                          <Badge className="bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest border-none px-3 py-0.5 shadow-md shadow-emerald-600/20">Default</Badge>
                        )}
                      </div>
                      <p className="text-base font-bold text-slate-500 mt-2 tracking-tight">{addr.street}</p>
                      <p className="text-base font-medium text-slate-400">{addr.city}, {addr.state} - {addr.zip}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteAddress(addr.id)}
                      className="h-10 w-10 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    {!addr.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setAsDefaultAddress(addr.id)}
                        className="h-10 w-10 rounded-2xl text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all active:scale-90"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {addresses.length === 0 && !showAddAddress && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center rounded-[40px] border-4 border-dashed border-slate-100 bg-white/40 backdrop-blur-sm">
              <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6 shadow-inner">
                <MapPin className="w-12 h-12" />
              </div>
              <p className="text-slate-900 font-black text-2xl mb-2">No Saved Locations</p>
              <p className="text-slate-400 font-medium text-lg mb-10 max-w-sm text-center">Your secure vault is empty. Add an address for lightning-fast deliveries!</p>
              <Button onClick={() => setShowAddAddress(true)} className="bg-slate-900 text-white hover:bg-emerald-600 rounded-full font-black px-12 h-14 shadow-2xl transition-all hover:scale-105">
                Setup First Address
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
