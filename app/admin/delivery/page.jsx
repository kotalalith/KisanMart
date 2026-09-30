'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MapPin, Truck, AlertTriangle, Search, Check, Edit2, Loader2, Save, Clock, Globe } from 'lucide-react'

export default function AdminDeliveryPage() {
  const [sellers, setSellers] = useState([])
  const [sellersSettings, setSellersSettings] = useState({})
  const [waitlist, setWaitlist] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit State
  const [editingSellerId, setEditingSellerId] = useState(null)
  const [editForm, setEditForm] = useState({
    radius_km: 150,
    min_order_amount: 300,
    delivery_fee: 50,
    free_delivery_threshold: 1000,
    same_day_delivery: true,
    pickup_lat: 18.5204,
    pickup_lng: 73.8567,
    allowed_pincodes: '',
    blocked_pincodes: '',
    active: true
  })

  // Selected Seller for Map Focus
  const [selectedSeller, setSelectedSeller] = useState(null)

  // Load Sellers
  useEffect(() => {
    const unsubSellers = onSnapshot(collection(db, "sellers"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSellers(list)
      if (list.length > 0 && !selectedSeller) {
        setSelectedSeller(list[0])
      }
    })

    const unsubSettings = onSnapshot(collection(db, "sellers_delivery_settings"), (snap) => {
      const settings = {}
      snap.docs.forEach(d => {
        settings[d.id] = d.data()
      })
      setSellersSettings(settings)
      setLoading(false)
    })

    const qWaitlist = query(collection(db, "waitlist"), orderBy("createdAt", "desc"))
    const unsubWaitlist = onSnapshot(qWaitlist, (snap) => {
      setWaitlist(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const qLogs = query(collection(db, "location_audit_logs"), orderBy("createdAt", "desc"), limit(40))
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubSellers()
      unsubSettings()
      unsubWaitlist()
      unsubLogs()
    }
  }, [])

  const getSellerSettings = (sellerId) => {
    const settings = sellersSettings[sellerId]
    if (settings) return settings
    
    // Fallback Mock Defaults
    const defaultSettings = {
      radius_km: 250,
      min_order_amount: 300,
      delivery_fee: 50,
      free_delivery_threshold: 1000,
      same_day_delivery: true,
      pickup_lat: 18.5204,
      pickup_lng: 73.8567,
      allowed_pincodes: '',
      blocked_pincodes: '',
      active: true
    }

    if (sellerId === 'seller-1') { defaultSettings.pickup_lat = 18.5204; defaultSettings.pickup_lng = 73.8567; defaultSettings.radius_km = 150; }
    else if (sellerId === 'seller-2') { defaultSettings.pickup_lat = 30.9010; defaultSettings.pickup_lng = 75.8573; defaultSettings.radius_km = 500; }
    else if (sellerId === 'seller-3') { defaultSettings.pickup_lat = 16.9902; defaultSettings.pickup_lng = 73.3120; defaultSettings.radius_km = 200; }
    else if (sellerId === 'seller-4') { defaultSettings.pickup_lat = 9.9189; defaultSettings.pickup_lng = 77.1025; defaultSettings.radius_km = 400; }
    else if (sellerId === 'seller-5') { defaultSettings.pickup_lat = 19.9975; defaultSettings.pickup_lng = 73.7898; defaultSettings.radius_km = 150; }
    else if (sellerId === 'seller-6') { defaultSettings.pickup_lat = 21.5222; defaultSettings.pickup_lng = 70.4579; defaultSettings.radius_km = 300; }
    else if (sellerId === 'seller-7') { defaultSettings.pickup_lat = 17.3850; defaultSettings.pickup_lng = 78.4867; defaultSettings.radius_km = 250; }
    return defaultSettings
  }

  const handleEditClick = (seller) => {
    const settings = getSellerSettings(seller.id)
    setEditingSellerId(seller.id)
    setEditForm({
      radius_km: settings.radius_km,
      min_order_amount: settings.min_order_amount,
      delivery_fee: settings.delivery_fee,
      free_delivery_threshold: settings.free_delivery_threshold,
      same_day_delivery: settings.same_day_delivery,
      pickup_lat: settings.pickup_lat,
      pickup_lng: settings.pickup_lng,
      allowed_pincodes: settings.allowed_pincodes || '',
      blocked_pincodes: settings.blocked_pincodes || '',
      active: settings.active ?? true
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      const docRef = doc(db, "sellers_delivery_settings", editingSellerId)
      await setDoc(docRef, {
        ...editForm,
        radius_km: parseFloat(editForm.radius_km) || 0,
        min_order_amount: parseFloat(editForm.min_order_amount) || 0,
        delivery_fee: parseFloat(editForm.delivery_fee) || 0,
        free_delivery_threshold: parseFloat(editForm.free_delivery_threshold) || 0,
        pickup_lat: parseFloat(editForm.pickup_lat) || 18.5204,
        pickup_lng: parseFloat(editForm.pickup_lng) || 73.8567,
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Audit Log log entry
      await setDoc(doc(collection(db, "location_audit_logs")), {
        action: "ADMIN_EDIT_SELLER_SETTINGS",
        details: { sellerId: editingSellerId, ...editForm },
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
        userId: "admin"
      })

      setEditingSellerId(null)
      alert("Seller settings updated successfully!")
    } catch (e) {
      console.error(e)
      alert("Failed to save changes")
    }
  }

  const focusedSettings = selectedSeller ? getSellerSettings(selectedSeller.id) : null

  // Analyze waitlist to identify high-demand non-serviceable districts
  const waitlistStats = waitlist.reduce((acc, curr) => {
    const key = curr.city_detected || 'Unknown Area'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const highDemandRegions = Object.entries(waitlistStats)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Logistics & Delivery Admin Center</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Configure service bounds, oversee coverage regions, check logs, and audit delivery settings.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 sm:gap-6">
        
        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sellers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{sellers.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Radius</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {Math.round(sellers.reduce((sum, s) => sum + getSellerSettings(s.id).radius_km, 0) / (sellers.length || 1))} km
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waitlist Entries</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{waitlist.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Logs</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{auditLogs.length}</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Panel grid */}
      <div className="grid gap-8 lg:grid-cols-3">

        {/* Sellers & Map: Col span 2 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Coverage Map */}
          <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
            <CardHeader className="bg-slate-50 px-6 py-4 flex flex-row items-center justify-between border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-black">Active Seller Coverage Mapping</CardTitle>
                <CardDescription className="text-xs">Selected Seller: {selectedSeller?.businessName || 'None'}</CardDescription>
              </div>
              {focusedSettings && (
                <Badge className="bg-emerald-600 text-white font-extrabold text-[10px] tracking-wide rounded">
                  Radius: {focusedSettings.radius_km} km
                </Badge>
              )}
            </CardHeader>
            <div className="h-[300px] w-full bg-slate-100 relative">
              {focusedSettings ? (
                <iframe
                  title="Seller Range Preview"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${focusedSettings.pickup_lng - 0.15}%2C${focusedSettings.pickup_lat - 0.15}%2C${focusedSettings.pickup_lng + 0.15}%2C${focusedSettings.pickup_lat + 0.15}&layer=mapnik&marker=${focusedSettings.pickup_lat}%2C${focusedSettings.pickup_lng}`}
                  className="w-full h-full border-none"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-semibold">
                  Select a seller below to center the coverage map
                </div>
              )}
            </div>
          </Card>

          {/* Sellers settings list */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-black text-slate-950">Sellers Logistics Directory</CardTitle>
              <CardDescription>Click edit to override GPS warehouse coordinates, serviceable radii, and blacklist parameters.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {sellers.map((seller) => {
                const settings = getSellerSettings(seller.id)
                const isSelected = selectedSeller?.id === seller.id

                return (
                  <div 
                    key={seller.id} 
                    onClick={() => setSelectedSeller(seller)}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-xl p-4 transition-all cursor-pointer ${
                      isSelected ? 'border-emerald-500 bg-emerald-50/10 shadow-sm' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <MapPin className={`h-5 w-5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{seller.businessName || seller.name}</h4>
                        <p className="text-slate-400 text-xs mt-0.5">{seller.businessType || 'Farmer'}</p>
                        
                        <div className="flex flex-wrap gap-2 items-center mt-2.5">
                          <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-500 font-semibold bg-slate-50">
                            {settings.pickup_lat.toFixed(4)}, {settings.pickup_lng.toFixed(4)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-500 font-semibold bg-slate-50">
                            {settings.radius_km} km radius
                          </Badge>
                          {!settings.active && (
                            <Badge variant="destructive" className="text-[8px] py-0 uppercase font-black tracking-widest">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-3 sm:mt-0" onClick={e => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditClick(seller)}
                        className="rounded-lg h-9 font-bold text-xs"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Logistics
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

        </div>

        {/* Waitlists & Audit logs: Col span 1 */}
        <div className="space-y-6">

          {/* Seller settings form editor popup card */}
          {editingSellerId && (
            <Card className="border-emerald-200 bg-emerald-50/10 shadow-lg rounded-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-black text-emerald-900">Edit Seller Logistics</CardTitle>
                <CardDescription className="text-xs">Seller ID: {editingSellerId}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                    <Label htmlFor="edit-active" className="text-xs font-bold">Delivery Status Active</Label>
                    <Switch 
                      id="edit-active"
                      checked={editForm.active}
                      onCheckedChange={(c) => setEditForm({...editForm, active: c})}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Radius (km)</Label>
                    <Input 
                      type="number" 
                      value={editForm.radius_km} 
                      onChange={e => setEditForm({...editForm, radius_km: e.target.value})}
                      required
                      className="bg-white rounded-lg h-9 text-xs border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Pickup Lat</Label>
                      <Input 
                        type="number" 
                        step="any"
                        value={editForm.pickup_lat} 
                        onChange={e => setEditForm({...editForm, pickup_lat: e.target.value})}
                        required
                        className="bg-white font-mono rounded-lg h-9 text-xs border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Pickup Lng</Label>
                      <Input 
                        type="number" 
                        step="any"
                        value={editForm.pickup_lng} 
                        onChange={e => setEditForm({...editForm, pickup_lng: e.target.value})}
                        required
                        className="bg-white font-mono rounded-lg h-9 text-xs border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Min Order (Rs.)</Label>
                      <Input 
                        type="number" 
                        value={editForm.min_order_amount} 
                        onChange={e => setEditForm({...editForm, min_order_amount: e.target.value})}
                        required
                        className="bg-white rounded-lg h-9 text-xs border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-slate-400">Delivery Fee (Rs.)</Label>
                      <Input 
                        type="number" 
                        value={editForm.delivery_fee} 
                        onChange={e => setEditForm({...editForm, delivery_fee: e.target.value})}
                        required
                        className="bg-white rounded-lg h-9 text-xs border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Allowed Pincodes</Label>
                    <Textarea 
                      value={editForm.allowed_pincodes} 
                      onChange={e => setEditForm({...editForm, allowed_pincodes: e.target.value})}
                      placeholder="e.g. 500081, 411028"
                      className="bg-white rounded-lg text-xs border-slate-200"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Blocked Pincodes</Label>
                    <Textarea 
                      value={editForm.blocked_pincodes} 
                      onChange={e => setEditForm({...editForm, blocked_pincodes: e.target.value})}
                      placeholder="e.g. 110001, 400001"
                      className="bg-white rounded-lg text-xs border-slate-200"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg h-10 text-xs">
                      <Save className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingSellerId(null)} className="rounded-lg h-10 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      Cancel
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>
          )}

          {/* Waitlist stats - High-Demand Non-Serviceable Areas */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                High-Demand Non-Serviceable Zones
              </CardTitle>
              <CardDescription className="text-xs">Based on user waitlist requests outside active ranges.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {highDemandRegions.length === 0 ? (
                <p className="text-slate-400 font-semibold text-xs py-4 text-center">No waitlist entries registered yet</p>
              ) : (
                highDemandRegions.map((region, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex gap-2 items-center">
                      <span className="h-6 w-6 rounded bg-amber-100 text-amber-700 text-[11px] font-black flex items-center justify-center">
                        #{i+1}
                      </span>
                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">{region.city}</span>
                    </div>
                    <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200 font-extrabold text-xs">
                      {region.count} requests
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-black">Location Transition Audit Trail</CardTitle>
              <CardDescription className="text-xs">Audit log of failed geolocations, pincode queries, and overrides.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {auditLogs.length === 0 ? (
                  <p className="text-slate-400 font-semibold text-xs py-8 text-center">No logs generated yet</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="border-b border-slate-50 pb-2 space-y-1">
                      <div className="flex justify-between items-start text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded uppercase font-black tracking-tight text-[8px] ${
                          log.action.includes("FAILED") || log.action.includes("DENIED") ? 'bg-red-100 text-red-700' :
                          log.action.includes("SUCCESS") ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {log.action.replace("REVERSE_GEOCODE_", "")}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      
                      {log.details && (
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                          {log.details.city || log.details.pincode || log.details.error ? (
                            <>
                              {log.details.city && `Resolved: ${log.details.city}`}
                              {log.details.pincode && ` | Pin: ${log.details.pincode}`}
                              {log.details.error && `Err: ${log.details.error}`}
                            </>
                          ) : (
                            JSON.stringify(log.details)
                          )}
                        </p>
                      )}
                      
                      <p className="text-[9px] text-slate-400 font-semibold">User ID: {log.userId || 'guest'}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
