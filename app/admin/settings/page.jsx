"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Settings,
  Shield,
  Truck,
  IndianRupee,
  Bell,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  Building,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"

const DEFAULT_SETTINGS = {
  // General Platform
  platformName: "AgroBridge Marketplace",
  supportEmail: "support@agrobridge.com",
  supportPhone: "+91 98765 43210",
  defaultCurrency: "INR (₹)",
  gstRate: 5,
  maintenanceMode: false,

  // Escrow & Commission
  platformCommissionRate: 4.5,
  escrowHoldHours: 24,
  minPayoutThreshold: 1000,
  autoReleaseEscrow: true,
  allowCOD: true,

  // Logistics & Delivery
  baseDeliveryFee: 49,
  freeDeliveryAbove: 999,
  maxDeliveryRadiusKm: 35,
  driverBasePayout: 35,

  // Verification & Security
  mandatoryFarmerKYC: true,
  requireLandRecord712: true,
  twoFactorAdminAuth: false,
  smsNotificationsEnabled: true,
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agrobridge_admin_settings")
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
      }
    } catch (e) {
      console.error("Failed to read settings from localStorage", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      try {
        localStorage.setItem("agrobridge_admin_settings", JSON.stringify(settings))
        toast.success("Platform settings saved successfully!")
      } catch (err) {
        toast.error("Failed to save settings.")
      } finally {
        setIsSaving(false)
      }
    }, 400)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem("agrobridge_admin_settings")
    toast.info("Settings restored to factory defaults.")
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-emerald-950">System Settings</h1>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50 text-xs font-bold">
              v2.4 Production
            </Badge>
          </div>
          <p className="text-emerald-700/60 font-medium text-sm mt-0.5">
            Configure global marketplace policies, escrow thresholds, and fleet parameters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {settings.maintenanceMode && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Maintenance Mode is Active</p>
            <p className="text-xs text-amber-700">Buyer transactions and new listings are temporarily paused.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white/80 border border-slate-200/80 p-1 rounded-2xl mb-6 shadow-sm">
          <TabsTrigger value="general" className="rounded-xl font-bold text-xs gap-1.5">
            <Building className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="escrow" className="rounded-xl font-bold text-xs gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" /> Escrow & Fees
          </TabsTrigger>
          <TabsTrigger value="logistics" className="rounded-xl font-bold text-xs gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Delivery & Fleet
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl font-bold text-xs gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Verification & KYC
          </TabsTrigger>
        </TabsList>

        {/* 1. General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Marketplace Identity & Support</CardTitle>
              <CardDescription>Public branding and support touchpoints displayed to buyers and farmers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName" className="text-xs font-bold text-slate-700">Platform Brand Name</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => handleChange("platformName", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency" className="text-xs font-bold text-slate-700">Primary Currency</Label>
                  <Input
                    id="defaultCurrency"
                    value={settings.defaultCurrency}
                    disabled
                    className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail" className="text-xs font-bold text-slate-700">Escalation Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange("supportEmail", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone" className="text-xs font-bold text-slate-700">Farmer Toll-Free / Helpdesk</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) => handleChange("supportPhone", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstRate" className="text-xs font-bold text-slate-700">Applicable GST / Tax Rate (%)</Label>
                  <Input
                    id="gstRate"
                    type="number"
                    value={settings.gstRate}
                    onChange={(e) => handleChange("gstRate", Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Temporarily prevent checkout while performing server upgrades</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleChange("maintenanceMode", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Escrow & Commission Tab */}
        <TabsContent value="escrow" className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Escrow Security & Take-Rate Policies</CardTitle>
              <CardDescription>Define how payments are held in escrow and released to farmers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Platform Commission Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.platformCommissionRate}
                    onChange={(e) => handleChange("platformCommissionRate", Number(e.target.value))}
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">Deducted automatically from seller escrow on completion</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Escrow Inspection Window (Hours)</Label>
                  <Input
                    type="number"
                    value={settings.escrowHoldHours}
                    onChange={(e) => handleChange("escrowHoldHours", Number(e.target.value))}
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">Time allowed for buyer produce quality dispute before auto-settlement</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Minimum Payout Request (₹)</Label>
                  <Input
                    type="number"
                    value={settings.minPayoutThreshold}
                    onChange={(e) => handleChange("minPayoutThreshold", Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Automated Escrow Release</p>
                    <p className="text-xs text-slate-500">Automatically disburse funds to farmer bank account once dispute window expires</p>
                  </div>
                  <Switch
                    checked={settings.autoReleaseEscrow}
                    onCheckedChange={(checked) => handleChange("autoReleaseEscrow", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Enable Cash on Delivery (COD)</p>
                    <p className="text-xs text-slate-500">Permit buyers to pay upon physical doorstep delivery inspection</p>
                  </div>
                  <Switch
                    checked={settings.allowCOD}
                    onCheckedChange={(checked) => handleChange("allowCOD", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Logistics Tab */}
        <TabsContent value="logistics" className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Fleet & Delivery Parameters</CardTitle>
              <CardDescription>Zone dispatch rules and driver compensation formulas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Base Delivery Charge (₹)</Label>
                  <Input
                    type="number"
                    value={settings.baseDeliveryFee}
                    onChange={(e) => handleChange("baseDeliveryFee", Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Free Delivery Threshold (₹)</Label>
                  <Input
                    type="number"
                    value={settings.freeDeliveryAbove}
                    onChange={(e) => handleChange("freeDeliveryAbove", Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Max Delivery Radius (KM)</Label>
                  <Input
                    type="number"
                    value={settings.maxDeliveryRadiusKm}
                    onChange={(e) => handleChange("maxDeliveryRadiusKm", Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Driver Base Pay Per Drop (₹)</Label>
                  <Input
                    type="number"
                    value={settings.driverBasePayout}
                    onChange={(e) => handleChange("driverBasePayout", Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Verification Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/90">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Verification & Security Governance</CardTitle>
              <CardDescription>Onboarding guardrails to maintain platform safety and trust.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">Mandatory Farmer KYC</p>
                  <p className="text-xs text-slate-500">Require Aadhaar & bank verification before products can be published</p>
                </div>
                <Switch
                  checked={settings.mandatoryFarmerKYC}
                  onCheckedChange={(checked) => handleChange("mandatoryFarmerKYC", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">Land Record 7/12 Validation</p>
                  <p className="text-xs text-slate-500">Require agricultural land parcel proof to obtain 'Verified Farmer' badge</p>
                </div>
                <Switch
                  checked={settings.requireLandRecord712}
                  onCheckedChange={(checked) => handleChange("requireLandRecord712", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">Two-Factor Admin Authentication</p>
                  <p className="text-xs text-slate-500">Require OTP verification for admin console modifications</p>
                </div>
                <Switch
                  checked={settings.twoFactorAdminAuth}
                  onCheckedChange={(checked) => handleChange("twoFactorAdminAuth", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
