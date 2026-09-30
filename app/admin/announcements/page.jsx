'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  updateDoc,
  doc, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Check, 
  Volume2, 
  Globe, 
  Sparkles, 
  HelpCircle,
  Calendar,
  Smartphone,
  BarChart2,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'

const CATEGORY_OPTIONS = [
  { value: 'updates', label: 'Platform Updates' },
  { value: 'features', label: 'New Feature Releases' },
  { value: 'maintenance', label: 'Service Maintenance' },
  { value: 'policies', label: 'Terms & Policies' },
  { value: 'rewards', label: 'Buyer Rewards' },
  { value: 'referrals', label: 'Referrals Programs' },
  { value: 'promotions', label: 'Promotional Banners' }
]

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'buyer', label: 'Buyers Only' },
  { value: 'seller', label: 'Sellers Only' },
  { value: 'delivery', label: 'Logistics Partners' }
]

const DISPLAY_TYPES = [
  { value: 'banner', label: 'Top Banner Carousel' },
  { value: 'popup', label: 'Dashboard Popup Alert' },
  { value: 'feed', label: 'Announcements Feed only' }
]

export default function AdminAnnouncements() {
  const [activeTab, setActiveTab] = useState('list') // list, create, templates, audits
  const [announcements, setAnnouncements] = useState([])
  const [templates, setTemplates] = useState([])
  const [views, setViews] = useState([])
  const [clicks, setClicks] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Campaign Form
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'updates',
    targetAudience: 'all',
    displayType: 'banner',
    imageUrl: '',
    actionText: '',
    actionLink: '',
    priority: 'Medium',
    startAt: '',
    endAt: '',
    status: 'published' // draft, published
  })
  
  const [editId, setEditId] = useState(null)
  
  // 2. Template Creator Form
  const [templateForm, setTemplateForm] = useState({
    title: '',
    content: '',
    category: 'updates',
    displayType: 'banner',
    actionText: '',
    actionLink: '',
    icon: 'Megaphone'
  })

  // 3. Preview States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Listen to Firestore
  useEffect(() => {
    // A. Sync announcements
    const qAnn = query(collection(db, "announcements"), orderBy("createdAt", "desc"))
    const unsubAnn = onSnapshot(qAnn, (snap) => {
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    // B. Sync templates
    const qTemplates = query(collection(db, "announcement_templates"), orderBy("createdAt", "desc"))
    const unsubTemplates = onSnapshot(qTemplates, (snap) => {
      setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    // C. Sync views & clicks for CTR metrics
    const unsubViews = onSnapshot(collection(db, "announcement_views"), (snap) => {
      setViews(snap.docs.map(doc => doc.data()))
    })
    const unsubClicks = onSnapshot(collection(db, "announcement_clicks"), (snap) => {
      setClicks(snap.docs.map(doc => doc.data()))
    })

    // D. Sync audit logs
    const qAudits = query(collection(db, "notification_audit_logs"), where("actionType", "in", ["announcement_created", "announcement_edited", "announcement_deleted", "announcement_archived"]), orderBy("timestamp", "desc"), limit(30))
    const unsubAudits = onSnapshot(qAudits, (snap) => {
      setAuditLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    })

    return () => {
      unsubAnn()
      unsubTemplates()
      unsubViews()
      unsubClicks()
      unsubAudits()
    }
  }, [])

  // 4. Aggregate Analytics (CTR grouped by campaignId)
  const ctrMetrics = useMemo(() => {
    const stats = {}
    
    // Group views
    views.forEach(v => {
      if (!v.campaignId) return
      if (!stats[v.campaignId]) stats[v.campaignId] = { viewsCount: 0, clicksCount: 0 }
      stats[v.campaignId].viewsCount++
    })

    // Group clicks
    clicks.forEach(c => {
      if (!c.campaignId) return
      if (!stats[c.campaignId]) stats[c.campaignId] = { viewsCount: 0, clicksCount: 0 }
      stats[c.campaignId].clicksCount++
    })

    return stats
  }, [views, clicks])

  // Reset form
  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      category: 'updates',
      targetAudience: 'all',
      displayType: 'banner',
      imageUrl: '',
      actionText: '',
      actionLink: '',
      priority: 'Medium',
      startAt: '',
      endAt: '',
      status: 'published'
    })
    setEditId(null)
  }

  // Edit action
  const handleEditInit = (item) => {
    setEditId(item.id)
    setForm({
      title: item.title || '',
      content: item.content || '',
      category: item.category || 'updates',
      targetAudience: item.targetAudience || 'all',
      displayType: item.displayType || 'banner',
      imageUrl: item.imageUrl || '',
      actionText: item.actionText || '',
      actionLink: item.actionLink || '',
      priority: item.priority || 'Medium',
      startAt: item.startAt?.toDate?.() ? item.startAt.toDate().toISOString().substring(0, 16) : '',
      endAt: item.endAt?.toDate?.() ? item.endAt.toDate().toISOString().substring(0, 16) : '',
      status: item.status || 'published'
    })
    setActiveTab('create')
  }

  // CRUD Submit
  const handleSubmitCampaign = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      toast.error("Title and description are required!")
      return
    }

    const toastId = toast.loading(editId ? "Updating announcement..." : "Publishing announcement...")

    try {
      const payload = {
        ...form,
        startAt: form.startAt ? new Date(form.startAt) : null,
        endAt: form.endAt ? new Date(form.endAt) : null,
        updatedAt: serverTimestamp()
      }

      if (editId) {
        // Update
        const ref = doc(db, "announcements", editId)
        await updateDoc(ref, payload)

        await addDoc(collection(db, "notification_audit_logs"), {
          adminId: "admin-super",
          actionType: "announcement_edited",
          targetId: editId,
          timestamp: serverTimestamp(),
          details: { title: form.title, status: form.status }
        })

        toast.success("Announcement updated successfully!", { id: toastId })
      } else {
        // Create
        payload.createdAt = serverTimestamp()
        const docRef = await addDoc(collection(db, "announcements"), payload)

        await addDoc(collection(db, "notification_audit_logs"), {
          adminId: "admin-super",
          actionType: "announcement_created",
          targetId: docRef.id,
          timestamp: serverTimestamp(),
          details: { title: form.title, audience: form.targetAudience, status: form.status }
        })

        toast.success("Announcement published successfully!", { id: toastId })
      }

      resetForm()
      setActiveTab('list')
    } catch (err) {
      console.error(err)
      toast.error("Failed to submit announcement.", { id: toastId })
    }
  }

  // Delete Campaign
  const handleDeleteCampaign = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    const toastId = toast.loading("Deleting announcement...")
    try {
      await deleteDoc(doc(db, "announcements", id))

      await addDoc(collection(db, "notification_audit_logs"), {
        adminId: "admin-super",
        actionType: "announcement_deleted",
        targetId: id,
        timestamp: serverTimestamp(),
        details: { title }
      })

      toast.success("Announcement deleted successfully!", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Deletion failed.", { id: toastId })
    }
  }

  // Duplicate Campaign
  const handleDuplicate = async (item) => {
    const toastId = toast.loading("Duplicating announcement...")
    try {
      const payload = {
        title: `${item.title} (Copy)`,
        content: item.content || '',
        category: item.category || 'updates',
        targetAudience: item.targetAudience || 'all',
        displayType: item.displayType || 'banner',
        imageUrl: item.imageUrl || '',
        actionText: item.actionText || '',
        actionLink: item.actionLink || '',
        priority: item.priority || 'Medium',
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, "announcements"), payload)
      toast.success("Duplicated to draft!", { id: toastId })
    } catch (e) {
      console.error(e)
      toast.error("Duplication failed.", { id: toastId })
    }
  }

  // Submit Template
  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    if (!templateForm.title || !templateForm.content) {
      toast.error("Template title and content are required!")
      return
    }

    const toastId = toast.loading("Saving template...")
    try {
      await addDoc(collection(db, "announcement_templates"), {
        ...templateForm,
        createdAt: serverTimestamp()
      })
      toast.success("Template saved!", { id: toastId })
      setTemplateForm({
        title: '',
        content: '',
        category: 'updates',
        displayType: 'banner',
        actionText: '',
        actionLink: '',
        icon: 'Megaphone'
      })
    } catch (e) {
      console.error(e)
      toast.error("Failed to save.", { id: toastId })
    }
  }

  // Load template into compose form
  const handleLoadTemplate = (t) => {
    setForm(prev => ({
      ...prev,
      title: t.title || '',
      content: t.content || '',
      category: t.category || 'updates',
      displayType: t.displayType || 'banner',
      actionText: t.actionText || '',
      actionLink: t.actionLink || ''
    }))
    toast.success(`Loaded template: ${t.title}`)
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
      
      {/* Overview stats bar */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border max-w-md">
        {[
          { id: 'list', label: 'Active Campaigns', icon: Megaphone },
          { id: 'create', label: editId ? 'Edit Campaign' : 'New Campaign', icon: Plus },
          { id: 'templates', label: 'Templates', icon: Copy },
          { id: 'audits', label: 'Audit Logs', icon: Settings },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); if (t.id !== 'create') resetForm(); }}
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

      {/* Listing tab */}
      {activeTab === 'list' && (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black tracking-tight uppercase">Campaign Dashboard</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage platform-wide announcement formats and CTR tracking</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {announcements.length === 0 ? (
              <div className="py-20 text-center text-xs font-black uppercase text-slate-400">
                No active announcements
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="pb-4">Announcement Details</th>
                      <th className="pb-4">Category</th>
                      <th className="pb-4">Audience</th>
                      <th className="pb-4">Format</th>
                      <th className="pb-4 text-center">Views</th>
                      <th className="pb-4 text-center">Clicks</th>
                      <th className="pb-4 text-center">CTR</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {announcements.map((item) => {
                      const metrics = ctrMetrics[item.id] || { viewsCount: 0, clicksCount: 0 }
                      const ctr = metrics.viewsCount > 0 ? Math.round((metrics.clicksCount / metrics.viewsCount) * 100) : 0

                      return (
                        <tr key={item.id} className="border-b hover:bg-slate-50/50">
                          <td className="py-4">
                            <div className="font-bold text-slate-900">{item.title}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px] leading-tight mt-0.5">{item.content}</div>
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className="text-[8px] uppercase tracking-wider font-bold">{item.category}</Badge>
                          </td>
                          <td className="py-4 uppercase text-[9px] font-black text-slate-500">{item.targetAudience}</td>
                          <td className="py-4 uppercase text-[9px] font-black text-slate-500">{item.displayType}</td>
                          <td className="py-4 text-center font-bold">{metrics.viewsCount}</td>
                          <td className="py-4 text-center font-bold text-blue-600">{metrics.clicksCount}</td>
                          <td className="py-4 text-center font-bold text-rose-600">{ctr}%</td>
                          <td className="py-4">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border-none",
                              item.status === 'published' ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
                            )}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="py-4 text-right space-x-1 whitespace-nowrap">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-emerald-600 rounded-lg" onClick={() => handleEditInit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 rounded-lg" onClick={() => handleDuplicate(item)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg" onClick={() => handleDeleteCampaign(item.id, item.title)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Creation/Edit Form tab */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
            <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black tracking-tight uppercase">{editId ? 'Modify Platform Announcement' : 'Publish Platform Announcement'}</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure layout, audience target, deep links, and durations</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmitCampaign} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Category */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Category</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Audience Cohort</Label>
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
                  {/* Display Format */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Format Layout</Label>
                    <select
                      value={form.displayType}
                      onChange={(e) => setForm({ ...form, displayType: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {DISPLAY_TYPES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Level */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Alert Level</Label>
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

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Publish Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="published">Active & Published</option>
                      <option value="draft">Save to Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date visibility (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                  {/* End Date */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiration End Date (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                </div>

                {/* Banner image URL */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner Image URL (Recommended for Popups)</Label>
                  <Input
                    placeholder="https://images.unsplash.com/... or /premium-banner.png"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Title Header</Label>
                  <Input
                    placeholder="Enter announcement title header"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                  />
                </div>

                {/* Content description */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Content description copy</Label>
                  <textarea
                    placeholder="Detail the updates, feature changes, referral guidelines or promotional details here..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={4}
                    className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Action Link */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Call-to-Action Link Path (Redirect)</Label>
                    <Input
                      placeholder="/announcements or /seller/kyc etc."
                      value={form.actionLink}
                      onChange={(e) => setForm({ ...form, actionLink: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                  {/* Action Text */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Button Text Label</Label>
                    <Input
                      placeholder="e.g. Read Updates or Claim Reward"
                      value={form.actionText}
                      onChange={(e) => setForm({ ...form, actionText: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {/* Preview Modal Button */}
                  <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        className="flex-1 h-12 bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5"
                      >
                        <Smartphone className="h-4 w-4" /> Live Mobile Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined} className="max-w-[360px] p-0 overflow-hidden rounded-[2.5rem] border-4 border-slate-900 bg-slate-100 shadow-2xl">
                      <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
                        <DialogTitle className="text-xs font-bold uppercase tracking-widest text-slate-300">Live PWA preview</DialogTitle>
                        <Badge variant="outline" className="text-[8px] uppercase font-bold text-emerald-400 border-emerald-400 leading-none">role: {form.targetAudience}</Badge>
                      </DialogHeader>

                      <div className="p-4 space-y-4 h-[450px] overflow-y-auto">
                        {/* Render Banner format preview */}
                        {form.displayType === 'banner' && (
                          <div className={cn(
                            "p-3 rounded-2xl border flex items-center text-xs font-bold",
                            form.priority === 'Critical' ? 'bg-rose-50 border-rose-100 text-rose-950' : 'bg-emerald-50 border-emerald-100 text-emerald-950'
                          )}>
                            <Megaphone className="h-4 w-4 text-emerald-600 mr-2 shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              <strong>{form.title || 'Title Header'}</strong>: {form.content || 'Announcement content description placeholder...'}
                            </div>
                          </div>
                        )}

                        {/* Render Popup layout preview */}
                        {form.displayType === 'popup' && (
                          <div className="rounded-2xl border bg-white shadow-md overflow-hidden text-slate-800 text-xs">
                            {form.imageUrl ? (
                              <div className="h-28 w-full bg-slate-200">
                                <img src={form.imageUrl} className="h-full w-full object-cover" alt="preview" />
                              </div>
                            ) : (
                              <div className="p-4 bg-emerald-600 text-white font-bold">{form.title || 'Header Title'}</div>
                            )}
                            <div className="p-4 space-y-3">
                              {form.imageUrl && <strong className="block text-slate-900">{form.title || 'Header Title'}</strong>}
                              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{form.content || 'Content copy details placeholder...'}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 rounded-lg text-[9px] uppercase tracking-wider font-bold">Dismiss</Button>
                                <Button size="sm" className="flex-1 rounded-lg text-[9px] bg-emerald-600 text-white hover:bg-emerald-700 uppercase tracking-wider font-bold">{form.actionText || 'Read Details'}</Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Feed layout preview */}
                        {form.displayType === 'feed' && (
                          <div className="bg-white border rounded-2xl p-4 space-y-2 shadow-sm text-xs">
                            <Badge variant="secondary" className="text-[8px] uppercase font-bold">{form.category}</Badge>
                            <h4 className="font-black text-slate-900">{form.title || 'Header Title'}</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{form.content || 'Content description details...'}</p>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="p-4 bg-slate-900 flex justify-center">
                        <Button type="button" onClick={() => setIsPreviewOpen(false)} className="w-full rounded-xl bg-emerald-600 text-white font-black text-[10px] tracking-widest uppercase">Close preview</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-emerald-100"
                  >
                    <Check className="h-4 w-4" />
                    {editId ? 'Save Changes' : 'Publish Now'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sidebar template triggers */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Template Presets</h3>
            {templates.length === 0 ? (
              <div className="py-20 text-center text-xs font-black uppercase text-slate-400 bg-white border rounded-[2.5rem]">
                No templates saved
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <Card 
                    key={t.id} 
                    className="border-none shadow-sm rounded-2xl p-4 bg-white hover:border-emerald-100 cursor-pointer border border-transparent transition-all flex justify-between items-center"
                    onClick={() => handleLoadTemplate(t)}
                  >
                    <div>
                      <span className="text-xs font-black text-slate-800 block">{t.title}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.category} - {t.displayType}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest text-emerald-600">Load</Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates CRUD tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-black tracking-tight uppercase">Save Preset Template</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Register templates to load quickly during campaigns</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Type</Label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Format Layout</Label>
                    <select
                      value={templateForm.displayType}
                      onChange={(e) => setTemplateForm({ ...templateForm, displayType: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {DISPLAY_TYPES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Title</Label>
                  <Input
                    placeholder="Enter template header title"
                    value={templateForm.title}
                    onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                    className="h-12 border-slate-100 bg-slate-50 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template content</Label>
                  <textarea
                    placeholder="Announcement template description copy..."
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    rows={4}
                    className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Link</Label>
                    <Input
                      placeholder="/announcements"
                      value={templateForm.actionLink}
                      onChange={(e) => setTemplateForm({ ...templateForm, actionLink: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Text</Label>
                    <Input
                      placeholder="Read Details"
                      value={templateForm.actionText}
                      onChange={(e) => setTemplateForm({ ...templateForm, actionText: e.target.value })}
                      className="h-12 border-slate-100 bg-slate-50 font-bold"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-slate-900 text-white hover:bg-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Plus className="h-4 w-4" /> Save Template Preset
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List templates */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Saved Template Library</h3>
            {templates.length === 0 ? (
              <div className="py-20 text-center text-xs font-black uppercase text-slate-400 bg-white border rounded-[2.5rem]">
                No templates saved
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <Card key={t.id} className="border-none shadow-sm rounded-2xl p-6 bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">{t.title}</span>
                      <Badge className="bg-blue-50 text-blue-800 border-none font-bold text-[8px] uppercase tracking-widest px-2 py-0.5">{t.category}</Badge>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed truncate">{t.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance audits tab */}
      {activeTab === 'audits' && (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black tracking-tight uppercase">Platform Action Audit Trails</CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Immutable tracking log records for announcement campaigns actions</CardDescription>
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
                    <div className="h-8 w-8 bg-slate-100 text-slate-400 flex items-center justify-center rounded-xl shrink-0 mt-0.5 animate-in fade-in zoom-in-95">
                      <Volume2 className="h-4.5 w-4.5" />
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
                        Executed action <Badge variant="outline" className="text-[9px] font-black uppercase py-0 px-1.5 bg-slate-100">{log.actionType}</Badge> for document <strong className="text-slate-800">{log.targetId}</strong>.
                      </p>
                      {log.details && (
                        <div className="bg-white p-2.5 rounded-lg border text-[10px] font-mono font-medium text-slate-500 overflow-x-auto mt-2 leading-relaxed whitespace-pre-wrap select-all">
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
