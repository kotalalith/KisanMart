'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye, Leaf, Star, Sparkles, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadToS3 } from '@/app/actions/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useProducts } from '@/lib/product-context'
import { useSellers } from '@/lib/seller-context'
import { useCategories } from '@/lib/category-context'
import { toast } from 'sonner'

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  out_of_stock: 'bg-red-100 text-red-700',
}

export default function SellerProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts()
  const { currentSeller } = useSellers()
  const { categories } = useCategories()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('kg')
  const [stock, setStock] = useState('')
  const [description, setDescription] = useState('')
  const [isOrganic, setIsOrganic] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [variants, setVariants] = useState([])
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [productImages, setProductImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const isCategoryApproved = (cat) => {
    if (!cat) return true;
    if (!currentSeller?.approvedCategories || currentSeller.approvedCategories.length === 0) return true;
    if (currentSeller.approvedCategories.includes('all')) return true;
    return currentSeller.approvedCategories.some(ap => 
      ap === cat.id || 
      ap.toLowerCase() === cat.name?.toLowerCase() ||
      (ap === 'cat-1' && cat.name?.toLowerCase().includes('veg')) ||
      (ap === 'cat-2' && cat.name?.toLowerCase().includes('fruit')) ||
      (ap === 'cat-3' && cat.name?.toLowerCase().includes('grain')) ||
      (ap === 'cat-4' && cat.name?.toLowerCase().includes('pulse')) ||
      (ap === 'cat-5' && cat.name?.toLowerCase().includes('dairy')) ||
      (ap === 'cat-6' && cat.name?.toLowerCase().includes('spice'))
    );
  };

  const addVariant = () => {
    setVariants([...variants, { id: Date.now(), label: '', price: '', stock: '', weight: '1' }])
  }

  const removeVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id))
  }

  const updateVariant = (id, field, value) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const openAddDialog = () => {
    setEditingProduct(null)
    setProductName('')
    setPrice('')
    setCategory('')
    setUnit('kg')
    setStock('')
    setDescription('')
    setIsOrganic(false)
    setIsFeatured(false)
    setVariants([])
    setProductImages([])
    setIsDialogOpen(true)
  }

  const openEditDialog = (product) => {
    setEditingProduct(product)
    setProductName(product.name)
    setPrice(product.basePrice.toString())
    setCategory(product.categoryId)
    setUnit(product.unit)
    setStock(product.stockQty?.toString() || product.stock?.toString() || '')
    setDescription(product.description || '')
    setIsOrganic(product.isOrganic)
    setIsFeatured(product.isFeatured)
    setVariants(product.variants || [])
    setProductImages(product.images || [])
    setIsDialogOpen(true)
  }
  
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setIsUploading(true)
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const result = await uploadToS3(formData)
        if (result.success) {
          return result.url
        } else {
          console.error("S3 upload failed:", result.error)
          return null
        }
      } catch (error) {
        console.error("Error uploading image:", error)
        return null
      }
    })

    const urls = await Promise.all(uploadPromises)
    const validUrls = urls.filter(url => url !== null)
    setProductImages(prev => [...prev, ...validUrls].slice(0, 5))
    setIsUploading(false)
  }

  const removeImage = (index) => {
    setProductImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitProduct = async () => {
    if (!productName || !price || !category) {
      toast.error("Please fill in all required fields (Name, Price, Category).")
      return
    }

    const selectedCat = categories.find(c => c.id === category);
    if (!isCategoryApproved(selectedCat || { id: category, name: category })) {
      toast.error("Your account is not approved to sell products in this category.")
      return
    }

    const basePriceNum = parseFloat(aiSuggestion ? aiSuggestion.price : price) || 0
    const defaultStockNum = parseFloat(stock) || 0
    
    // Process variants and only include necessary fields for the database
    const processedVariants = variants.map(v => ({
      id: v.id,
      label: v.label,
      price: parseFloat(v.price) || basePriceNum
    }))

    // Since variant stock is removed, we use the "Default Stock Quantity" field for total stock
    const finalStock = defaultStockNum

    const productData = {
      name: productName,
      basePrice: basePriceNum,
      categoryId: category,
      categoryName: categories.find(c => c.id === category)?.name || 'Vegetables',
      unit,
      stockQty: finalStock,
      stock: finalStock,
      description,
      isOrganic,
      isFeatured,
      variants: processedVariants,
      sellerId: currentSeller?.id || 'seller-1',
      sellerName: currentSeller?.businessName || 'Green Valley Farms',
      status: finalStock > 0 ? 'active' : 'out_of_stock',
      images: productImages.length > 0 ? productImages : ['/placeholder.svg'],
      updatedAt: new Date().toISOString()
    }

    if (editingProduct) {
      await updateProduct({ ...productData, id: editingProduct.id })
    } else {
      await addProduct({
        ...productData,
        rating: 4.5,
        reviewCount: 0,
        createdAt: new Date().toISOString()
      })
    }

    // Reset form
    setProductName('')
    setPrice('')
    setAiSuggestion(null)
    setIsDialogOpen(false)
    setEditingProduct(null)
    setProductImages([])
  }

  const handleSmartSuggest = () => {
    // Simulate AI analysis based on name
    const base = productName.toLowerCase().includes('tomato') ? 45 : 
                 productName.toLowerCase().includes('rice') ? 65 : 
                 productName.toLowerCase().includes('chilli') ? 120 : 80
    
    setAiSuggestion({
      price: base,
      reason: 'Based on current market trends in your region (+5% demand)'
    })
  }

  // Filter products by seller (mock: seller-1)
  const sellerProducts = products.filter((p) => p.sellerId === 'seller-1')

  const filteredProducts = sellerProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Button className="gap-2" onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the details for your product.' : 'Fill in the details to add a new product to your catalog.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium">Product Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Fresh Organic Tomatoes" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="bg-muted/20 border-muted-foreground/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select onValueChange={setCategory} value={category}>
                    <SelectTrigger className="bg-muted/20 border-muted-foreground/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const approvedList = categories.filter(isCategoryApproved);
                        const displayList = (approvedList && approvedList.length > 0) ? approvedList : categories;
                        return displayList && displayList.length > 0 ? (
                          displayList.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground text-center">No categories found.</div>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price" className="text-sm font-medium">Base Price (Rs.)</Label>
                    <button 
                      type="button"
                      onClick={handleSmartSuggest}
                      className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-2 py-0.5 rounded-full"
                    >
                      <Sparkles className="h-3 w-3" />
                      Smart Suggest
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0" 
                      value={aiSuggestion ? aiSuggestion.price : price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-muted/20 border-muted-foreground/20"
                    />
                    {aiSuggestion && (
                      <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-primary/5 p-2 border border-primary/20 animate-in fade-in slide-in-from-top-1">
                        <Sparkles className="mt-0.5 h-3 w-3 text-primary shrink-0" />
                        <p className="text-[10px] leading-tight text-muted-foreground">
                          <span className="font-bold text-primary">AI Suggestion: Rs. {aiSuggestion.price}</span>
                          <br />
                          {aiSuggestion.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="unit" className="text-sm font-medium">Default Unit</Label>
                  <Select onValueChange={setUnit} defaultValue="kg" value={unit}>
                    <SelectTrigger className="bg-muted/20 border-muted-foreground/20">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="quintal">Quintal</SelectItem>
                      <SelectItem value="ton">Ton</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="dozen">Dozen</SelectItem>
                      <SelectItem value="litre">Litre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock" className="text-sm font-medium">Default Stock Quantity</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    placeholder="e.g. 100" 
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="bg-muted/20 border-muted-foreground/20 focus:border-primary font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Note: If you add price variants below, you can specify stock for each variant or use this as total stock.
                  </p>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Product Images</Label>
                  <span className="text-[10px] text-muted-foreground">{productImages.length}/5 images</span>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {productImages.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl bg-muted border border-muted-foreground/10 overflow-hidden group">
                      <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {productImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex flex-col items-center justify-center aspect-square rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-primary mb-1" />
                          <span className="text-[10px] font-medium text-primary">Upload</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageUpload} 
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Tip: Upload high-quality square images for better visibility.
                </p>
              </div>

              <div className="grid gap-2">

                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product quality, source, and freshness..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted/20 border-muted-foreground/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-8 py-2">
                <div className="flex items-center gap-3">
                  <Switch id="organic" checked={isOrganic} onCheckedChange={setIsOrganic} />
                  <Label htmlFor="organic" className="text-sm cursor-pointer">Organic Product</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                  <Label htmlFor="featured" className="text-sm cursor-pointer">Featured Product</Label>
                </div>
              </div>

              {/* Redesigned Variants Section */}
              <div className="pt-6 border-t border-muted-foreground/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Price Variants</Label>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Add weights like 250g, 500g, 1kg</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-2 h-9 px-4 border-primary/30 text-primary hover:bg-primary/5 font-medium">
                    <Plus className="h-4 w-4" />
                    Add Variant
                  </Button>
                </div>
                
                {variants.length === 0 ? (
                  <div className="bg-muted/10 border border-dashed rounded-xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">No custom weights added. The default price and stock will be used.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {variants.map((variant, index) => (
                      <div key={variant.id} className="group flex items-center gap-4 bg-background border border-muted-foreground/10 p-4 rounded-xl shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 flex-1 gap-6">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Label (e.g. 250g, 1kg)</Label>
                            <Input 
                              placeholder="e.g. 250g" 
                              value={variant.label} 
                              onChange={(e) => updateVariant(variant.id, 'label', e.target.value)} 
                              className="h-10 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary font-medium"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Price for this variant (Rs.)</Label>
                            <Input 
                              type="number" 
                              placeholder="Price" 
                              value={variant.price} 
                              onChange={(e) => updateVariant(variant.id, 'price', e.target.value)} 
                              className="h-10 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary font-medium"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeVariant(variant.id)}
                          className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 border-t border-muted-foreground/10 bg-muted/5">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="px-6">
              Cancel
            </Button>
            <Button onClick={handleSubmitProduct} className="px-8 font-bold shadow-lg shadow-primary/20">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sellerProducts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {sellerProducts.filter((p) => p.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {sellerProducts.filter((p) => p.status === 'out_of_stock').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Product List</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">
                            {product.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <div className="flex gap-1">
                          {product.isOrganic && (
                            <Badge variant="secondary" className="gap-1 text-[10px] px-1 py-0 bg-green-100 text-green-700">
                              <Leaf className="h-2.5 w-2.5" />
                              Organic
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.categoryName}
                  </TableCell>
                  <TableCell>
                    Rs. {product.basePrice}/{product.unit}
                  </TableCell>
                  <TableCell>{product.stockQty} {product.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[product.status]}>
                      {product.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/product/${product.id}`} className="flex items-center w-full">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteProduct(product.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}





