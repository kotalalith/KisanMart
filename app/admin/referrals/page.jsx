'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc, query, orderBy, limit } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Users, Gift, Wallet, Settings, TrendingUp, CheckCircle, Clock } from 'lucide-react'

export default function AdminReferralsPage() {
  const [settings, setSettings] = useState({
    enabled: true,
    referrerReward: 100,
    friendReward: 50,
    minOrderValue: 300,
  })
  const [isSaving, setIsSaving] = useState(false)
  
  const [referrals, setReferrals] = useState([])
  const [loadingReferrals, setLoadingReferrals] = useState(true)

  // Load Settings
  useEffect(() => {
    const settingsRef = doc(db, 'admin_settings', 'referral')
    const unsubscribe = onSnapshot(settingsRef, async (snap) => {
      if (snap.exists()) {
        setSettings(snap.data())
      } else {
        // Initialize default settings if not exists
        await setDoc(settingsRef, settings)
      }
    })
    return () => unsubscribe()
  }, [])

  // Load Referrals
  useEffect(() => {
    const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'), limit(100))
    const unsubscribe = onSnapshot(q, (snap) => {
      const refs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setReferrals(refs)
      setLoadingReferrals(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const settingsRef = doc(db, 'admin_settings', 'referral')
      await updateDoc(settingsRef, settings)
      toast.success("Referral settings updated successfully!")
    } catch (error) {
      console.error("Error updating settings:", error)
      toast.error("Failed to update settings.")
    } finally {
      setIsSaving(false)
    }
  }

  // Metrics calculation
  const totalInvites = referrals.length
  const successfulReferrals = referrals.filter(r => r.status === 'credited' || r.status === 'Delivered').length
  const totalCreditsIssued = successfulReferrals * (settings.referrerReward || 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Referrals & Wallet Program</h1>
          <p className="text-sm text-slate-500">Manage referral settings and view performance metrics.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Invites</p>
                <div className="text-2xl font-bold text-slate-900">{totalInvites}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Successful Conversions</p>
                <div className="text-2xl font-bold text-slate-900">{successfulReferrals}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Wallet Credits Issued</p>
                <div className="text-2xl font-bold text-slate-900">₹{totalCreditsIssued}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
                <div className="text-2xl font-bold text-slate-900">
                  {totalInvites > 0 ? Math.round((successfulReferrals / totalInvites) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <Card className="border-none shadow-sm bg-white lg:col-span-1">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Program Settings</CardTitle>
            </div>
            <CardDescription>Configure reward values and program rules.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Enable Referrals</Label>
                <p className="text-xs text-muted-foreground">Turn the program on or off.</p>
              </div>
              <Switch 
                checked={settings.enabled} 
                onCheckedChange={(val) => setSettings({...settings, enabled: val})} 
              />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-slate-700">Referrer Reward (₹)</Label>
              <div className="text-xs text-muted-foreground mb-1">Amount credited to inviter after successful delivery.</div>
              <Input 
                type="number" 
                value={settings.referrerReward} 
                onChange={(e) => setSettings({...settings, referrerReward: Number(e.target.value)})} 
                className="font-medium bg-slate-50"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-slate-700">Friend Signup Bonus (₹)</Label>
              <div className="text-xs text-muted-foreground mb-1">Amount credited to friend immediately upon applying code.</div>
              <Input 
                type="number" 
                value={settings.friendReward} 
                onChange={(e) => setSettings({...settings, friendReward: Number(e.target.value)})} 
                className="font-medium bg-slate-50"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-slate-700">Minimum Order Value (₹)</Label>
              <div className="text-xs text-muted-foreground mb-1">Friend must order above this amount to trigger referrer reward.</div>
              <Input 
                type="number" 
                value={settings.minOrderValue} 
                onChange={(e) => setSettings({...settings, minOrderValue: Number(e.target.value)})} 
                className="font-medium bg-slate-50"
              />
            </div>

            <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold">
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Referral Logs Table */}
        <Card className="border-none shadow-sm bg-white lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg">Recent Referrals Log</CardTitle>
            <CardDescription>Track status of invitations and redemptions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[500px]">
            {loadingReferrals ? (
              <div className="p-8 text-center text-slate-500">Loading referral data...</div>
            ) : referrals.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No referrals found yet.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Referrer</th>
                    <th className="px-6 py-4">Friend</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map(ref => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{ref.referrerName || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-600">{ref.refereeName || 'Friend'}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {ref.status === 'credited' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> Credited
                          </span>
                        ) : ref.status === 'Delivered' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pending Order
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
