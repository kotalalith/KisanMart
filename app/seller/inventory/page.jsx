'use client'

import { useState } from 'react'
import { Package, AlertTriangle, CheckCircle2, XCircle, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProducts } from '@/lib/product-context'
import { useNotifications } from '@/lib/notification-context'

const statusConfig = {
  in_stock: { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  low_stock: { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  out_of_stock: { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function InventoryPage() {
  const { products, updateProduct, loading } = useProducts()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [movementType, setMovementType] = useState('in')
  const [updateQuantity, setUpdateQuantity] = useState('')
  const [updateReason, setUpdateReason] = useState('')

  const handleUpdateStock = async () => {
    if (!selectedProductId || !updateQuantity) return

    const product = sellerProducts.find(p => p.id === selectedProductId)
    if (!product) return

    const qty = parseFloat(updateQuantity)
    let newStock = product.stockQty || product.stock || 0

    if (movementType === 'in') newStock += qty
    else if (movementType === 'out') newStock = Math.max(0, newStock - qty)
    else newStock = qty // Adjustment

    await updateProduct({
      ...product,
      stock: newStock,
      stockQty: newStock,
      status: newStock > 0 ? 'active' : 'out_of_stock',
      updatedAt: new Date().toISOString()
    })

    setIsDialogOpen(false)
    setSelectedProductId(null)
    setUpdateQuantity('')
    setUpdateReason('')
  }
  
  // Filter for current seller (mock: seller-1)
  const sellerProducts = products.filter(p => p.sellerId === 'seller-1')

  const inventoryData = sellerProducts.map(p => {
    const currentStock = p.stockQty || p.stock || 0
    let status = 'in_stock'
    if (currentStock === 0) status = 'out_of_stock'
    else if (currentStock <= 10) status = 'low_stock'

    return {
      id: p.id,
      productName: p.name,
      sku: p.id.slice(-8).toUpperCase(),
      currentStock,
      minStock: 10,
      maxStock: Math.max(currentStock, 100),
      lastRestocked: p.updatedAt || p.createdAt,
      unit: p.unit,
      status
    }
  })

  const inStockCount = inventoryData.filter((i) => i.status === 'in_stock').length
  const lowStockCount = inventoryData.filter((i) => i.status === 'low_stock').length
  const outOfStockCount = inventoryData.filter((i) => i.status === 'out_of_stock').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your stock levels
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Update Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock</DialogTitle>
              <DialogDescription>
                Add or remove stock for a product.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select value={selectedProductId || ''} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryData.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Movement Type</Label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Add)</SelectItem>
                    <SelectItem value="out">Stock Out (Remove)</SelectItem>
                    <SelectItem value="adjustment">Adjustment (Set to)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  placeholder="0" 
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input 
                  id="reason" 
                  placeholder="e.g., New shipment arrived" 
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStock}>Update Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Stock</p>
              <p className="text-2xl font-bold">{inStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-yellow-100 p-3 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-red-100 p-3 text-red-700">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{outOfStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products found in your inventory.
                  </TableCell>
                </TableRow>
              ) : (
                inventoryData.map((item) => {
                  const status = statusConfig[item.status]
                  const stockPercentage = Math.min((item.currentStock / item.maxStock) * 100, 100)

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell>
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="space-y-1">
                          <Progress
                            value={stockPercentage}
                            className={`h-2 ${
                              item.status === 'out_of_stock'
                                ? '[&>div]:bg-red-500'
                                : item.status === 'low_stock'
                                ? '[&>div]:bg-yellow-500'
                                : '[&>div]:bg-green-500'
                            }`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Min: {item.minStock} / Max: {item.maxStock}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.lastRestocked).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <status.icon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              const product = sellerProducts.find(p => p.id === item.id)
                              if (product) {
                                const newStock = (product.stockQty || product.stock || 0) + 1
                                updateProduct({ 
                                  ...product, 
                                  stock: newStock, 
                                  stockQty: newStock,
                                  status: newStock > 0 ? 'active' : 'out_of_stock'
                                })
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              const product = sellerProducts.find(p => p.id === item.id)
                              if (product && (product.stock > 0 || product.stockQty > 0)) {
                                const newStock = Math.max(0, (product.stockQty || product.stock || 0) - 1)
                                updateProduct({ 
                                  ...product, 
                                  stock: newStock, 
                                  stockQty: newStock,
                                  status: newStock > 0 ? 'active' : 'out_of_stock'
                                })
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}





