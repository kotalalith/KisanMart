'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@/lib/user-context'
import { db } from '@/lib/firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  writeBatch,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Bell, 
  Send, 
  Clock, 
  History, 
  FileText, 
  BarChart4, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Percent,
  Search,
  Settings,
  Edit,
  Copy,
  Archive,
  Trash2,
  RefreshCw,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRELOADED_TEMPLATES } from '@/lib/preloaded-templates'

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'buyer', label: 'All Buyers' },
  { value: 'seller', label: 'All Sellers' },
  { value: 'delivery', label: 'Logistics Partners' },
  { value: 'admin', label: 'Administrators' },
  { value: 'new_users', label: 'New Signups (<30 Days)' },
  { value: 'active_buyers', label: 'Active Buyers' },
  { value: 'high_value', label: 'High Value Customers (>₹10,000)' }
]

const CATEGORIES = ['orders', 'payments', 'deliveries', 'promotions', 'inventory', 'account']

export default function AdminNotifications() {
  const { userId: adminUserId } = useUser()
  const [activeTab, setActiveTab] = useState('campaigns') // campaigns, templates, logs, audits
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Form States
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'promotions',
    targetAudience: 'all',
    priority: 'High',
    clickAction: '/announcements',
    scheduledTime: ''
  })
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  // 2. Template Creator Form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    titleTemplate: '',
    bodyTemplate: '',
    category: 'promotions',
    clickAction: '/announcements'
  })

  // Template CRUD & filter states
  const [editTemplateId, setEditTemplateId] = useState(null)
  const [templateSearchQuery, setTemplateSearchQuery] = useState('')
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)

  // Placeholder mock data definition
  const PLACEHOLDER_MOCK_DATA = useMemo(() => ({
    userName: "Lalith",
    orderId: "AGR-ORD-482910",
    productName: "Organic Tomatoes",
    sellerName: "Farmer Ram",
    amount: "250",
    price: "40/kg",
    driverName: "Raju (Delivery)",
    driverPhone: "+91 98765 43210",
    remarks: "Leave at front gate",
    days: "3",
    weight: "25",
    otp: "4829",
    ticketId: "TK-9876",
    quantity: "50 kg",
    stockQty: "12",
    deliveryStatus: "Out for Delivery"
  }), [])

  // Placeholder resolver
  const renderPlaceholderText = (text) => {
    if (!text) return ""
    let rendered = text
    Object.keys(PLACEHOLDER_MOCK_DATA).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g')
      rendered = rendered.replace(regex, PLACEHOLDER_MOCK_DATA[key])
    })
    return rendered
  }

  // Filter templates list
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = 
        !templateSearchQuery ||
        t.name?.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        t.titleTemplate?.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        t.bodyTemplate?.toLowerCase().includes(templateSearchQuery.toLowerCase())
      
      const matchesCategory = 
        templateCategoryFilter === 'all' || 
        t.category === templateCategoryFilter

      const isArchived = t.isArchived === true
      const matchesArchive = showArchived ? isArchived : !isArchived

      return matchesSearch && matchesCategory && matchesArchive
    })
  }, [templates, templateSearchQuery, templateCategoryFilter, showArchived])

  // Listen to Firestore data
  useEffect(() => {
    // A. Sync campaigns
    const qCampaigns = query(collection(db, "notification_campaigns"), orderBy("createdAt", "desc"))
    const unsubCampaigns = onSnapshot(qCampaigns, (snap) => {
      setCampaigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    // B. Sync templates
    const qTemplates = query(collection(db, "notification_templates"), orderBy("createdAt", "desc"))
    const unsubTemplates = onSnapshot(qTemplates, (snap) => {
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    // C. Sync audit logs
    const qAudits = query(collection(db, "notification_audit_logs"), orderBy("timestamp", "desc"), limit(50))
    const unsubAudits = onSnapshot(qAudits, (snap) => {
      setAuditLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => {
      unsubCampaigns()
      unsubTemplates()
      unsubAudits()
    }
  }, [])

  // 3. KPI Calculations
  const metrics = useMemo(() => {
    if (campaigns.length === 0) return { totalSent: 0, successRate: 100, openRate: 0, ctr: 0 }
    
    let totalSent = 0
    let totalDelivered = 0
    let totalOpened = 0
    let totalClicked = 0

    campaigns.forEach(c => {
      totalSent += c.sentCount || 0
      totalDelivered += c.deliveredCount || 0
      totalOpened += c.openCount || 0
      totalClicked += c.clickCount || 0
    })

    const successRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100
    const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0
    const ctr = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0

    return { totalSent, successRate, openRate, ctr }
  }, [campaigns])

  // Handle template selection auto-fill
  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id)
    if (!id) return
    const selected = templates.find(t => t.id === id)
    if (selected) {
      setForm(prev => ({
        ...prev,
        title: selected.titleTemplate || '',
        body: selected.bodyTemplate || '',
        category: selected.category || 'promotions',
        clickAction: selected.clickAction || '/announcements'
      }))
      toast.success(`Loaded template: ${selected.name}`)
    }
  }

  // Submit Notification Campaign
  const handleLaunchCampaign = async (e) => {
    e.preventDefault()
    if (!form.title || !form.body) {
      toast.error("Title and message body are required!")
      return
    }

    const toastId = toast.loading("Launching notification campaign...")

    try {
      const scheduled = form.scheduledTime ? new Date(form.scheduledTime) : null
      const status = scheduled ? 'Scheduled' : 'Sent'

      // Step A: Create campaign document
      const campaignRef = await addDoc(collection(db, "notification_campaigns"), {
        title: form.title,
        body: form.body,
        category: form.category,
        targetAudience: form.targetAudience,
        priority: form.priority,
        clickAction: form.clickAction,
        status,
        scheduledAt: scheduled,
        sentCount: 0,
        deliveredCount: 0,
        openCount: 0,
        clickCount: 0,
        createdAt: serverTimestamp()
      })

      // Step B: Write admin compliance audit log
      await addDoc(collection(db, "notification_audit_logs"), {
        adminId: "admin-super", // Simulated admin auth context
        actionType: "campaign_launch",
        targetId: campaignRef.id,
        timestamp: serverTimestamp(),
        details: { 
          title: form.title, 
          audience: form.targetAudience, 
          priority: form.priority,
          status 
        }
      })

      // Step C: Trigger API push resolver if immediate send
      if (!scheduled) {
        const response = await fetch('/api/notify-fcm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaignRef.id,
            targetAudience: form.targetAudience,
            title: form.title,
            body: form.body,
            clickAction: form.clickAction,
            priority: form.priority
          })
        })
        const result = await response.json()
        toast.success(`Campaign dispatched successfully! Sent to ${result.sentCount || 0} active device tokens.`, { id: toastId })
      } else {
        toast.success(`Campaign scheduled for ${scheduled.toLocaleString()}!`, { id: toastId })
      }

      // Reset form
      setForm({
        title: '',
        body: '',
        category: 'promotions',
        targetAudience: 'all',
        priority: 'High',
        clickAction: '/announcements',
        scheduledTime: ''
      })
      setSelectedTemplateId('')
    } catch (err) {
      console.error(err)
      toast.error("Failed to execute campaign send. See console.", { id: toastId })
    }
  }

  // Send Test Notification to Admin's own device
  const handleSendTestToMe = async () => {
    if (!form.title || !form.body) {
      toast.error("Fill in a title and message body first!")
      return
    }

    const toastId = toast.loading("Sending test notification to your device...")

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminUserId || 'admin-super',
          title: `[TEST] ${form.title}`,
          body: form.body,
          clickAction: form.clickAction || '/',
          priority: form.priority || 'High',
          type: form.category || 'promotions',
          data: PLACEHOLDER_MOCK_DATA
        })
      })
      const result = await response.json()

      if (result.success) {
        toast.success(`Test notification delivered! Check your notification center.`, { id: toastId })
      } else {
        toast.error(`Test send failed: ${result.error || 'Unknown error'}`, { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to send test notification.", { id: toastId })
    }
  }

  // Save Template (Supports both Create and Edit)
  const handleSaveTemplate = async (e) => {
    e.preventDefault()
    if (!templateForm.name || !templateForm.titleTemplate) {
      toast.error("Template name and title template are required!")
      return
    }

    const toastId = toast.loading(editTemplateId ? "Updating template..." : "Saving template...")
    try {
      if (editTemplateId) {
        // Update existing template
        const docRef = doc(db, "notification_templates", editTemplateId)
        await updateDoc(docRef, {
          ...templateForm,
          updatedAt: serverTimestamp()
        })

        await addDoc(collection(db, "notification_audit_logs"), {
          adminId: "admin-super",
          actionType: "template_updated",
          targetId: editTemplateId,
          timestamp: serverTimestamp(),
          details: { name: templateForm.name, category: templateForm.category }
        })

        toast.success("Template updated successfully!", { id: toastId })
        setEditTemplateId(null)
      } else {
        // Create new template
        await addDoc(collection(db, "notification_templates"), {
          ...templateForm,
          isArchived: false,
          createdAt: serverTimestamp()
        })

        await addDoc(collection(db, "notification_audit_logs"), {
          adminId: "admin-super",
          actionType: "template_created",
          targetId: templateForm.name,
          timestamp: serverTimestamp(),
          details: { name: templateForm.name, category: templateForm.category }
        })

        toast.success("Template created successfully!", { id: toastId })
      }

      setTemplateForm({
        name: '',
        titleTemplate: '',
        bodyTemplate: '',
        category: 'promotions',
        clickAction: '/announcements'
      })
    } catch (err) {
      console.error(err)
      toast.error("Failed to save template.", { id: toastId })
    }
  }

  // Edit Trigger
  const startEditTemplate = (t) => {
    setEditTemplateId(t.id)
    setTemplateForm({
      name: t.name || '',
      titleTemplate: t.titleTemplate || '',
      bodyTemplate: t.bodyTemplate || '',
      category: t.category || 'promotions',
      clickAction: t.clickAction || '/announcements'
    })
    toast.info(`Editing template: ${t.name}`)
  }

  // Cancel Edit
  const cancelEditTemplate = () => {
    setEditTemplateId(null)
    setTemplateForm({
      name: '',
      titleTemplate: '',
      bodyTemplate: '',
      category: 'promotions',
      clickAction: '/announcements'
    })
  }

  // Duplicate Trigger
  const duplicateTemplate = (t) => {
    setEditTemplateId(null) // Reset edit mode
    setTemplateForm({
      name: `${t.name} (Copy)`,
      titleTemplate: t.titleTemplate || '',
      bodyTemplate: t.bodyTemplate || '',
      category: t.category || 'promotions',
      clickAction: t.clickAction || '/announcements'
    })
    toast.info(`Duplicated template settings to form. Ready to save!`)
  }

  // Archive / Unarchive Toggle
  const toggleArchiveTemplate = async (t) => {
    const newArchiveState = !t.isArchived
    const toastId = toast.loading(newArchiveState ? "Archiving template..." : "Unarchiving template...")
    try {
      const docRef = doc(db, "notification_templates", t.id)
      await updateDoc(docRef, {
        isArchived: newArchiveState
      })

      await addDoc(collection(db, "notification_audit_logs"), {
        adminId: "admin-super",
        actionType: newArchiveState ? "template_archived" : "template_unarchived",
        targetId: t.id,
        timestamp: serverTimestamp(),
        details: { name: t.name, isArchived: newArchiveState }
      })

      toast.success(newArchiveState ? "Template archived!" : "Template restored!", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Failed to update archive state.", { id: toastId })
    }
  }

  // Delete Trigger
  const deleteTemplate = async (t) => {
    if (!confirm(`Are you sure you want to permanently delete template "${t.name}"?`)) return
    const toastId = toast.loading("Deleting template...")
    try {
      const docRef = doc(db, "notification_templates", t.id)
      await deleteDoc(docRef)

      await addDoc(collection(db, "notification_audit_logs"), {
        adminId: "admin-super",
        actionType: "template_deleted",
        targetId: t.id,
        timestamp: serverTimestamp(),
        details: { name: t.name }
      })

      toast.success("Template deleted permanently!", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete template.", { id: toastId })
    }
  }

  // Seed Default Templates
  const handleSeedTemplates = async () => {
    const toastId = toast.loading("Seeding default template library...")
    try {
      const batch = writeBatch(db)
      PRELOADED_TEMPLATES.forEach((t) => {
        const docRef = doc(collection(db, "notification_templates"))
        batch.set(docRef, {
          name: t.name,
          titleTemplate: t.titleTemplate,
          bodyTemplate: t.bodyTemplate,
          category: t.category,
          clickAction: t.clickAction,
          isArchived: false,
          createdAt: serverTimestamp()
        })
      })
      await batch.commit()
      toast.success(`Seeded ${PRELOADED_TEMPLATES.length} templates successfully!`, { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Failed to seed template library.", { id: toastId })
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Notifications Sent', value: metrics.totalSent, icon: Send, bg: 'bg-emerald-50 text-emerald-700' },
          { label: 'Delivery Success', value: `${metrics.successRate}%`, icon: CheckCircle, bg: 'bg-blue-50 text-blue-700' },
          { label: 'Push Open Rate', value: `${metrics.openRate}%`, icon: Bell, bg: 'bg-purple-50 text-purple-700' },
          { label: 'Click Rate (CTR)', value: `${metrics.ctr}%`, icon: Percent, bg: 'bg-rose-50 text-rose-700' },
        ].map((s, idx) => (
          <Card key={idx} className="border-none shadow-sm rounded-2xl p-4 flex items-center gap-4 bg-white">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", s.bg)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-black tracking-tight mt-0.5">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs list */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border max-w-md">
        {[
          { id: 'campaigns', label: 'Broadcasts', icon: Send },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'logs', label: 'History & Stats', icon: History },
          { id: 'audits', label: 'Audit Compliance', icon: Settings },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Broadcast tab: Compose alert form */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-black tracking-tight uppercase">Compose Notification Campaign</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure parameters and dispatch to audience tokens</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleLaunchCampaign} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Select Reusable Template */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Load Template</Label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- Customize Manually --</option>
                      {templates.filter(t => !t.isArchived).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Segment Audience</Label>
                    <select
                      value={form.targetAudience}
                      onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {AUDIENCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category type</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</Label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {['Low', 'Medium', 'High', 'Critical'].map(prio => (
                        <option key={prio} value={prio}>{prio} Priority</option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Schedule date (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduledTime}
                      onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notification Title</Label>
                  <Input
                    placeholder="Enter short, punchy title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert message body</Label>
                  <textarea
                    placeholder="Describe announcement, offer, details or update..."
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={3}
                    className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Deep Link URL */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Click Redirect Deep Link Path</Label>
                  <Input
                    placeholder="/orders or /announcements etc."
                    value={form.clickAction}
                    onChange={(e) => setForm({ ...form, clickAction: e.target.value })}
                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-slate-900 text-white hover:bg-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                    {form.scheduledTime ? 'Schedule Broadcast' : 'Dispatch Broadcast Now'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTestToMe}
                    className="h-12 px-5 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    Test to Me
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sidebar Segment Guide info */}
          <div className="space-y-6">
            {/* Live PWA Notification Simulator Card */}
            <Card className="border-none shadow-xl rounded-3xl p-6 bg-slate-900 text-slate-100 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE PWA SIMULATOR
                </span>
                <span>Just Now</span>
              </div>

              {/* Notification Bubble */}
              <div className="bg-slate-800/90 border border-slate-700/50 rounded-2xl p-4 shadow-lg flex gap-3">
                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-black text-white truncate">
                    {renderPlaceholderText(form.title) || "Notification Title"}
                  </h5>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-1 break-words">
                    {renderPlaceholderText(form.body) || "Fill the fields to see how the notification renders dynamically."}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 px-1 py-0 font-bold uppercase tracking-wider">
                      {form.category}
                    </Badge>
                    <span className="text-[9px] text-slate-500 font-black tracking-widest">
                      {form.priority} PRIORITY
                    </span>
                  </div>
                </div>
              </div>

              {/* Mock variables table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-500">Simulated Variables</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400 bg-black/40 p-3 rounded-2xl border border-slate-800/80 max-h-36 overflow-y-auto">
                  {Object.entries(PLACEHOLDER_MOCK_DATA).map(([key, val]) => (
                    <div key={key} className="truncate">
                      <span className="text-slate-200 font-bold">{"{"}{key}{"}"}</span>: <span className="text-slate-400">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl p-6 bg-white space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audience Segmentation Guide</h4>
              <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                <p>💡 <strong className="text-slate-800">All Users:</strong> Broadcast to everyone.</p>
                <p>👤 <strong className="text-slate-800">Buyers / Sellers:</strong> Restrict to cohort groups.</p>
                <p>⚡ <strong className="text-slate-800">New Signups:</strong> Registered in last 30 days.</p>
                <p>💎 <strong className="text-slate-800">High Value:</strong> Buyers with total checkout spending exceeding ₹10,000.</p>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl p-6 bg-white space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority Dispatch Rules</h4>
              <div className="space-y-3.5 text-xs font-semibold text-slate-600">
                <p>🟢 <strong className="text-slate-800">Low / Medium:</strong> Silent push in-app feed sync only.</p>
                <p>🟡 <strong className="text-slate-800">High:</strong> Triggers PWA background FCM alert + toast message.</p>
                <p>🔴 <strong className="text-slate-800">Critical:</strong> Triggers FCM push + foreground toast + dashboard dialog popup.</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Templates tab: create, edit, duplicate, archive, categorize, and seed templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form & Simulator (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-xl font-black tracking-tight uppercase flex items-center justify-between">
                  <span>{editTemplateId ? 'Edit Template' : 'Create Template'}</span>
                  {editTemplateId && (
                    <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[8px] uppercase tracking-widest px-2 py-0.5">
                      Editing Mode
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {editTemplateId ? 'Modify template properties and click update' : 'Register a new reusable alert template'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Label Name</Label>
                    <Input
                      placeholder="e.g. Order Placed Notification"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Type</Label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Click Redirect URL</Label>
                      <Input
                        value={templateForm.clickAction}
                        onChange={(e) => setTemplateForm({ ...templateForm, clickAction: e.target.value })}
                        className="h-12 border-slate-100 bg-slate-50 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title Template Header (supports placeholders)</Label>
                    <Input
                      placeholder="e.g. Order #{orderId} Confirmed!"
                      value={templateForm.titleTemplate}
                      onChange={(e) => setTemplateForm({ ...templateForm, titleTemplate: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Body Template Message (supports placeholders)</Label>
                    <textarea
                      placeholder="e.g. Hi {userName}, your order of {productName} is ready."
                      value={templateForm.bodyTemplate}
                      onChange={(e) => setTemplateForm({ ...templateForm, bodyTemplate: e.target.value })}
                      rows={3}
                      className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 h-12 bg-slate-900 text-white hover:bg-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 shadow-md"
                    >
                      {editTemplateId ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {editTemplateId ? 'Update Template' : 'Save Template'}
                    </Button>
                    {editTemplateId && (
                      <Button
                        type="button"
                        onClick={cancelEditTemplate}
                        className="h-12 px-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Template Form Live PWA Preview bubble */}
            <Card className="border-none shadow-xl rounded-3xl p-6 bg-slate-900 text-slate-100 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  TEMPLATE LIVE RENDER PREVIEW
                </span>
                <span>PWA Format</span>
              </div>
              <div className="bg-slate-800/95 border border-slate-700/50 rounded-2xl p-4 shadow-lg flex gap-3">
                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-black text-white truncate">
                    {renderPlaceholderText(templateForm.titleTemplate) || "Template Header"}
                  </h5>
                  <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-1 break-words">
                    {renderPlaceholderText(templateForm.bodyTemplate) || "Write dynamic placeholders to watch them convert."}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 px-1.5 py-0 font-bold uppercase tracking-wider">
                      {templateForm.category}
                    </Badge>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                      Click URL: {templateForm.clickAction || "None"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: List & Filters (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Filter controls */}
            <Card className="border-none shadow-sm rounded-3xl p-6 bg-white space-y-4">
              
              {/* Search & Archives toggler */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search templates by name, title or contents..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="pl-10 h-10 border-slate-100 bg-slate-50 font-bold"
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowArchived(!showArchived)}
                    className={cn(
                      "h-10 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 flex items-center gap-1.5 border border-slate-100 bg-slate-50",
                      showArchived ? "bg-amber-50 border-amber-200 text-amber-800" : "text-slate-600"
                    )}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {showArchived ? 'View Active' : 'View Archived'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSeedTemplates}
                    className="h-10 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 flex items-center gap-1.5 text-emerald-700 border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Seed Defaults
                  </Button>
                </div>
              </div>

              {/* Category selector rows */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 mt-2">
                <button
                  onClick={() => setTemplateCategoryFilter('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-none",
                    templateCategoryFilter === 'all'
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:text-slate-700"
                  )}
                >
                  ALL CATEGORIES
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTemplateCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-none",
                      templateCategoryFilter === cat
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-50 text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Card>

            {/* List catalog */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                  {showArchived ? 'Archived Templates' : 'Active Templates'} ({filteredTemplates.length})
                </h3>
              </div>
              
              {filteredTemplates.length === 0 ? (
                <div className="py-24 text-center text-xs font-black uppercase text-slate-400 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center gap-4">
                  <div className="p-4 bg-slate-50 rounded-full">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                  <span>No templates match your search filters</span>
                  {templates.length === 0 && (
                    <Button
                      onClick={handleSeedTemplates}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-10 shadow-md flex items-center gap-1.5 mt-2"
                    >
                      <RefreshCw className="h-4 w-4" /> Seed 72 Default Templates
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                  {filteredTemplates.map(t => (
                    <Card key={t.id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 bg-white space-y-3 relative group">
                      
                      {/* Top row */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{t.name}</h4>
                          <span className="text-[8px] bg-slate-100 text-slate-600 font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block">
                            {t.category}
                          </span>
                        </div>
                        
                        {/* Action buttons (always visible but highlighted on hover) */}
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
                          <button
                            onClick={() => startEditTemplate(t)}
                            title="Edit template"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => duplicateTemplate(t)}
                            title="Duplicate template"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleArchiveTemplate(t)}
                            title={t.isArchived ? "Restore template" : "Archive template"}
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              t.isArchived 
                                ? "text-amber-600 hover:text-amber-800 hover:bg-amber-50" 
                                : "text-slate-500 hover:text-slate-900 hover:bg-white"
                            )}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(t)}
                            title="Delete template permanently"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Body previews */}
                      <div className="space-y-1 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/50 text-[11px]">
                        <p className="font-bold text-slate-700 leading-tight">
                          Title: <span className="font-semibold text-slate-500">{t.titleTemplate}</span>
                        </p>
                        <p className="font-bold text-slate-700 leading-normal mt-1">
                          Body: <span className="font-semibold text-slate-500">{t.bodyTemplate}</span>
                        </p>
                        {t.clickAction && (
                          <p className="font-bold text-slate-400 text-[9px] uppercase tracking-wider mt-1">
                            Link: <span className="text-slate-500 font-semibold">{t.clickAction}</span>
                          </p>
                        )}
                      </div>

                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Logs tab: campaign history details */}
      {activeTab === 'logs' && (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black tracking-tight uppercase">Campaign Broadcast Log</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Review historical campaigns performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {campaigns.length === 0 ? (
              <div className="py-20 text-center text-xs font-black uppercase text-slate-400">
                No campaigns executed yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="pb-4">Campaign Title</th>
                      <th className="pb-4">Audience</th>
                      <th className="pb-4">Priority</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-center">Sent</th>
                      <th className="pb-4 text-center">Delivered</th>
                      <th className="pb-4 text-center">Open Rate</th>
                      <th className="pb-4 text-center">CTR</th>
                      <th className="pb-4">Launched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const cOpenRate = c.deliveredCount > 0 ? Math.round(((c.openCount || 0) / c.deliveredCount) * 100) : 0
                      const cCtr = c.openCount > 0 ? Math.round(((c.clickCount || 0) / c.openCount) * 100) : 0

                      return (
                        <tr key={c.id} className="border-b hover:bg-slate-50/50">
                          <td className="py-4">
                            <div className="font-bold text-slate-900">{c.title}</div>
                            <div className="text-[10px] text-slate-400 max-w-[200px] truncate leading-tight mt-0.5">{c.body}</div>
                          </td>
                          <td className="py-4 uppercase text-[9px] font-black text-slate-500">{c.targetAudience}</td>
                          <td className="py-4">
                            <Badge className="text-[8px] border-none font-bold uppercase tracking-wide px-1.5 py-0.5 bg-slate-50 text-slate-600">
                              {c.priority}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border-none",
                              c.status === 'Sent' ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                            )}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-4 text-center font-bold">{c.sentCount || 0}</td>
                          <td className="py-4 text-center font-bold text-blue-600">{c.deliveredCount || 0}</td>
                          <td className="py-4 text-center font-bold text-purple-600">{cOpenRate}%</td>
                          <td className="py-4 text-center font-bold text-rose-600">{cCtr}%</td>
                          <td className="py-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {c.createdAt?.toDate?.() ? c.createdAt.toDate().toLocaleDateString() : 'Pending'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audits tab: log administrative compliance */}
      {activeTab === 'audits' && (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black tracking-tight uppercase">Administrative Audit Trails</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Immutable tracking logs for security compliance</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {auditLogs.length === 0 ? (
              <div className="py-20 text-center text-xs font-black uppercase text-slate-400">
                No audit entries recorded yet
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-600 leading-normal">
                    <div className="h-8 w-8 bg-slate-100 text-slate-400 flex items-center justify-center rounded-xl shrink-0 mt-0.5">
                      <Settings className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span className="font-black text-slate-800">
                          Admin ID: {log.adminId}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                          {log.timestamp?.toDate?.() ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium">
                        Performed action <Badge variant="outline" className="text-[9px] font-black uppercase py-0 px-1.5 bg-slate-100">{log.actionType}</Badge> targeting ID <strong className="text-slate-800">{log.targetId}</strong>.
                      </p>
                      {log.details && (
                        <div className="bg-white p-2.5 rounded-lg border text-[10px] font-mono font-medium text-slate-500 overflow-x-auto mt-2 select-all leading-relaxed whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
