"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Megaphone,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Percent,
  Gift,
  Calendar,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { usePromotions } from "@/lib/promotions-context"

export default function AdminPromotionsPage() {
  const { promotions, loading, addPromotion, updatePromotion, deletePromotion } = usePromotions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "percentage",
    value: 0,
    minOrder: 0,
    maxDiscount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    usageLimit: 1000,
  })

  const handleOpenCreate = () => {
    setEditingPromo(null)
    setFormData({
      name: "",
      code: "",
      type: "percentage",
      value: 0,
      minOrder: 0,
      maxDiscount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      usageLimit: 1000,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo)
    setFormData({
      name: promo.name,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      minOrder: promo.minOrder,
      maxDiscount: promo.maxDiscount,
      startDate: promo.startDate,
      endDate: promo.endDate,
      usageLimit: promo.usageLimit,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Simple status calculation
      const now = new Date().toISOString().split('T')[0]
      let status = "active"
      if (formData.startDate > now) status = "scheduled"
      if (formData.endDate < now) status = "expired"

      const data = { ...formData, status }

      if (editingPromo) {
        await updatePromotion(editingPromo.id, data)
      } else {
        await addPromotion(data)
      }
      setDialogOpen(false)
    } catch (error) {
      console.error("Submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      await deletePromotion(id)
    }
  }

  const activePromos = promotions.filter((p) => p.status === "active")
  const scheduledPromos = promotions.filter((p) => p.status === "scheduled")
  const totalRedemptions = promotions.reduce((acc, p) => acc + (p.usedCount || 0), 0)
  const totalDiscountGiven = promotions.reduce((acc, p) => acc + (p.totalDiscountValue || 0), 0)

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotions & Coupons</h1>
          <p className="text-muted-foreground">Create and manage promotional campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
              <DialogDescription>Set up a new promotional offer or coupon code</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promoName">Promotion Name</Label>
                  <Input 
                    id="promoName" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g., Summer Sale" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoCode">Coupon Code</Label>
                  <Input 
                    id="promoCode" 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    placeholder="e.g., SUMMER25" 
                    required 
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="flat">Flat Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Discount Value ({formData.type === 'percentage' ? '%' : 'Rs.'})</Label>
                  <Input 
                    id="value" 
                    type="number" 
                    value={formData.value} 
                    onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})} 
                    placeholder="e.g., 25" 
                    required 
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Min Order Value (Rs.)</Label>
                  <Input 
                    id="minOrder" 
                    type="number" 
                    value={formData.minOrder} 
                    onChange={(e) => setFormData({...formData, minOrder: parseFloat(e.target.value) || 0})} 
                    placeholder="e.g., 1000" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Max Discount (Rs.)</Label>
                  <Input 
                    id="maxDiscount" 
                    type="number" 
                    value={formData.maxDiscount} 
                    onChange={(e) => setFormData({...formData, maxDiscount: parseFloat(e.target.value) || 0})} 
                    placeholder="e.g., 500" 
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={formData.endDate} 
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input 
                    id="usageLimit" 
                    type="number" 
                    value={formData.usageLimit} 
                    onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value) || 0})} 
                    placeholder="e.g., 1000" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category || "All"} 
                    onValueChange={(val) => setFormData({...formData, category: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Categories</SelectItem>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                      <SelectItem value="Fruits">Fruits</SelectItem>
                      <SelectItem value="Grains">Grains</SelectItem>
                      <SelectItem value="Dairy">Dairy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : editingPromo ? "Update Promotion" : "Create Promotion"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Megaphone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePromos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPromos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRedemptions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discount Given</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {(totalDiscountGiven / 1000).toFixed(1)}k</div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
          <CardDescription>Manage your promotional campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promotion</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">
                    No promotions found. Create one to get started!
                  </TableCell>
                </TableRow>
              ) : (
                promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {promo.type === "percentage" ? (
                            <Percent className="h-5 w-5" />
                          ) : (
                            <Gift className="h-5 w-5" />
                          )}
                        </div>
                        <span className="font-medium">{promo.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">{promo.code}</code>
                    </TableCell>
                    <TableCell>
                      {promo.type === "percentage" ? `${promo.value}%` : `Rs. ${promo.value}`}
                      <p className="text-xs text-muted-foreground">Max: Rs. {promo.maxDiscount}</p>
                    </TableCell>
                    <TableCell>Rs. {promo.minOrder}</TableCell>
                    <TableCell>
                      <div className="w-full">
                        <p className="text-sm">
                          {promo.usedCount || 0} / {promo.usageLimit}
                        </p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${((promo.usedCount || 0) / promo.usageLimit) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(promo.startDate).toLocaleDateString('en-GB')} -{" "}
                      {new Date(promo.endDate).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          promo.status === "active"
                            ? "default"
                            : promo.status === "scheduled"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {promo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(promo)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const { id, ...promoData } = promo;
                            addPromotion({ ...promoData, code: promo.code + "_COPY" });
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(promo.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}






