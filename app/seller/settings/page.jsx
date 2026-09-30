'use client'

import { User, Building2, Bell, Shield, CreditCard, Globe, Truck, MapPin, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSellers } from '@/lib/seller-context'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'

export default function SettingsPage() {
  const { currentSeller } = useSellers()
  const sellerId = currentSeller?.id || 'seller-1'
  const [deliverySettings, setDeliverySettings] = useState({
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
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const docRef = doc(db, "sellers_delivery_settings", sellerId)
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setDeliverySettings(snap.data())
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [sellerId])

  const handleSaveDeliverySettings = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const docRef = doc(db, "sellers_delivery_settings", sellerId)
      await setDoc(docRef, {
        ...deliverySettings,
        radius_km: parseFloat(deliverySettings.radius_km) || 0,
        min_order_amount: parseFloat(deliverySettings.min_order_amount) || 0,
        delivery_fee: parseFloat(deliverySettings.delivery_fee) || 0,
        free_delivery_threshold: parseFloat(deliverySettings.free_delivery_threshold) || 0,
        pickup_lat: parseFloat(deliverySettings.pickup_lat) || 18.5204,
        pickup_lng: parseFloat(deliverySettings.pickup_lng) || 73.8567,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      alert("Delivery settings saved successfully!")
    } catch (error) {
      console.error("Error saving delivery settings:", error)
      alert("Failed to save delivery settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDetectPickupCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeliverySettings(prev => ({
            ...prev,
            pickup_lat: pos.coords.latitude,
            pickup_lng: pos.coords.longitude
          }))
        },
        (err) => {
          alert("Could not detect current coordinates. Please enter manually.")
        }
      )
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and store settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2">
            <Truck className="h-4 w-4" />
            Delivery Settings
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {currentSeller?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={currentSeller?.name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={currentSeller?.email || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue={currentSeller?.phone || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                      <SelectItem value="gu">Gujarati</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" defaultValue={currentSeller?.businessName || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select defaultValue={currentSeller?.businessType || 'farmer'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input id="gst" defaultValue={currentSeller?.gstNumber || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input id="pan" defaultValue={currentSeller?.panNumber || ''} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your business..."
                  rows={4}
                />
              </div>

              <Separator />

              <div>
                <h4 className="mb-4 font-medium">Bank Account</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" defaultValue={currentSeller?.bankDetails?.bankName || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      defaultValue={currentSeller?.bankDetails?.accountNumber ? `****${currentSeller.bankDetails.accountNumber.slice(-4)}` : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input id="ifsc" defaultValue={currentSeller?.bankDetails?.ifscCode || ''} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Orders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive a new order
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications for order status changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Received</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive a payment
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Alert when product stock is running low
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing & Promotions</p>
                    <p className="text-sm text-muted-foreground">
                      Updates about new features and promotions
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="mb-4 font-medium">Change Password</h4>
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="w-fit">Update Password</Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-4 font-medium">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">SMS Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a code via SMS when logging in
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-4 font-medium">Login Sessions</h4>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome on Windows - Mumbai, India
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Sign Out Other Devices
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Settings Tab */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-emerald-600 animate-pulse" />
                Configure Delivery & Logistics Settings
              </CardTitle>
              <CardDescription>Manage delivery radius, charges, coordinates, allowed and blocked pincodes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <form onSubmit={handleSaveDeliverySettings} className="space-y-6">
                  
                  {/* Status toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <Label htmlFor="delivery-active" className="text-sm font-extrabold text-slate-800">Enable Shop Delivery</Label>
                      <p className="text-xs text-slate-400 font-medium">Turn off to suspend delivery calculations for your products.</p>
                    </div>
                    <Switch 
                      id="delivery-active"
                      checked={deliverySettings.active} 
                      onCheckedChange={(checked) => setDeliverySettings({...deliverySettings, active: checked})} 
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Radius */}
                    <div className="space-y-2">
                      <Label htmlFor="radius_km">Delivery Radius (km)</Label>
                      <Input 
                        id="radius_km" 
                        type="number" 
                        value={deliverySettings.radius_km} 
                        onChange={(e) => setDeliverySettings({...deliverySettings, radius_km: e.target.value})}
                        required 
                        className="rounded-xl border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400">Products will only show deliverable within this radius.</p>
                    </div>

                    {/* Minimum order amount */}
                    <div className="space-y-2">
                      <Label htmlFor="min_order_amount">Minimum Order Amount (Rs.)</Label>
                      <Input 
                        id="min_order_amount" 
                        type="number" 
                        value={deliverySettings.min_order_amount} 
                        onChange={(e) => setDeliverySettings({...deliverySettings, min_order_amount: e.target.value})}
                        required 
                        className="rounded-xl border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400">Minimum total cart order amount from your store.</p>
                    </div>

                    {/* Delivery fee */}
                    <div className="space-y-2">
                      <Label htmlFor="delivery_fee">Base Delivery Fee (Rs.)</Label>
                      <Input 
                        id="delivery_fee" 
                        type="number" 
                        value={deliverySettings.delivery_fee} 
                        onChange={(e) => setDeliverySettings({...deliverySettings, delivery_fee: e.target.value})}
                        required 
                        className="rounded-xl border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400">Charged for standard shipping.</p>
                    </div>

                    {/* Free threshold */}
                    <div className="space-y-2">
                      <Label htmlFor="free_delivery_threshold">Free Delivery Threshold (Rs.)</Label>
                      <Input 
                        id="free_delivery_threshold" 
                        type="number" 
                        value={deliverySettings.free_delivery_threshold} 
                        onChange={(e) => setDeliverySettings({...deliverySettings, free_delivery_threshold: e.target.value})}
                        required 
                        className="rounded-xl border-slate-200"
                      />
                      <p className="text-[10px] text-slate-400">Waive delivery fee above this total cart order value.</p>
                    </div>

                    {/* Same-day check */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 md:col-span-2">
                      <div>
                        <Label htmlFor="same_day_delivery" className="text-sm font-extrabold text-slate-800">Same-Day Delivery Available</Label>
                        <p className="text-xs text-slate-400 font-medium">Advertise same-day delivery for buyers within close proximity (under 35km).</p>
                      </div>
                      <Switch 
                        id="same_day_delivery"
                        checked={deliverySettings.same_day_delivery} 
                        onCheckedChange={(checked) => setDeliverySettings({...deliverySettings, same_day_delivery: checked})} 
                      />
                    </div>

                  </div>

                  <Separator />

                  {/* Coordinates Selection */}
                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <Label className="text-sm font-extrabold text-slate-800">Dispatch / Pickup Coordinates</Label>
                        <p className="text-xs text-slate-400 font-medium">Used for direct distance calculations.</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleDetectPickupCoordinates}
                        className="rounded-xl border-emerald-500 text-emerald-700 bg-white font-bold h-9 text-xs w-full sm:w-auto"
                      >
                        <MapPin className="h-3.5 w-3.5 mr-1" /> Detect My Coordinates
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="pickup_lat" className="text-xs text-slate-500 font-bold">Latitude</Label>
                        <Input 
                          id="pickup_lat" 
                          type="number" 
                          step="any" 
                          value={deliverySettings.pickup_lat} 
                          onChange={(e) => setDeliverySettings({...deliverySettings, pickup_lat: e.target.value})}
                          required 
                          className="rounded-xl bg-white border-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pickup_lng" className="text-xs text-slate-500 font-bold">Longitude</Label>
                        <Input 
                          id="pickup_lng" 
                          type="number" 
                          step="any" 
                          value={deliverySettings.pickup_lng} 
                          onChange={(e) => setDeliverySettings({...deliverySettings, pickup_lng: e.target.value})}
                          required 
                          className="rounded-xl bg-white border-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Allowed / Blocked Pincodes list */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="allowed_pincodes">Allowed Pincodes (Optional Override)</Label>
                      <Textarea 
                        id="allowed_pincodes" 
                        placeholder="e.g. 500081, 500082, 411028"
                        value={deliverySettings.allowed_pincodes} 
                        onChange={(e) => setDeliverySettings({...deliverySettings, allowed_pincodes: e.target.value})}
                        className="rounded-xl border-slate-200"
                        rows={3}
                      />
                      <p className="text-[10px] text-slate-400">Comma-separated list. If provided, overrides distance radius calculations.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="blocked_pincodes">Blocked Pincodes (Blacklist)</Label>
                      <Textarea 
                        id="blocked_pincodes" 
                        placeholder="e.g. 110001, 400001"
                        value={deliverySettings.blocked_pincodes} 
                        onChange={(e) => setDeliverySettings({...deliverySettings, blocked_pincodes: e.target.value})}
                        className="rounded-xl border-slate-200"
                        rows={3}
                      />
                      <p className="text-[10px] text-slate-400">Comma-separated list. Block delivery calculations matching these exact pincodes.</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 h-12 rounded-xl">
                      {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-1.5" /> Save Delivery Settings</>}
                    </Button>
                  </div>

                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}





