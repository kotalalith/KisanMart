"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  MoreHorizontal,
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Ban,
  Star,
  FileText,
} from "lucide-react"
import { useSellers } from "@/lib/seller-context"
import { useProducts } from "@/lib/product-context"
import { IndianRupee, AlertCircle } from "lucide-react"
import { categories } from "@/lib/mock-data"

export default function AdminSellersPage() {
  const { sellers, approveKYC, rejectKYC, toggleSellerStatus, calculateSellerRating, approveCategory, rejectCategory } = useSellers()
  const { products } = useProducts()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [kycDialogOpen, setKycDialogOpen] = useState(false)

  const filteredSellers = sellers.filter(
    (seller) =>
      seller.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingKYC = sellers.filter((s) => s.kycStatus === "pending")
  const activeSellers = sellers.filter((s) => s.status === "active")
  const suspendedSellers = sellers.filter((s) => s.status === "suspended")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Management</h1>
          <p className="text-muted-foreground">Manage seller accounts and KYC verification</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSellers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingKYC.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspendedSellers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sellers Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Sellers</CardTitle>
              <CardDescription>Manage and verify seller accounts</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({sellers.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending KYC ({pendingKYC.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeSellers.length})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended ({suspendedSellers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <SellerTable
                sellers={filteredSellers}
                onViewKYC={(seller) => {
                  setSelectedSeller(seller)
                  setKycDialogOpen(true)
                }}
                onToggleStatus={toggleSellerStatus}
                products={products}
                calculateSellerRating={calculateSellerRating}
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <SellerTable
                sellers={pendingKYC.filter(
                  (s) =>
                    s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                onViewKYC={(seller) => {
                  setSelectedSeller(seller)
                  setKycDialogOpen(true)
                }}
                onToggleStatus={toggleSellerStatus}
                products={products}
                calculateSellerRating={calculateSellerRating}
              />
            </TabsContent>

            <TabsContent value="active" className="mt-4">
              <SellerTable
                sellers={activeSellers.filter(
                  (s) =>
                    s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                onViewKYC={(seller) => {
                  setSelectedSeller(seller)
                  setKycDialogOpen(true)
                }}
                onToggleStatus={toggleSellerStatus}
                products={products}
                calculateSellerRating={calculateSellerRating}
              />
            </TabsContent>

            <TabsContent value="suspended" className="mt-4">
              <SellerTable
                sellers={suspendedSellers.filter(
                  (s) =>
                    s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                onViewKYC={(seller) => {
                  setSelectedSeller(seller)
                  setKycDialogOpen(true)
                }}
                onToggleStatus={toggleSellerStatus}
                products={products}
                calculateSellerRating={calculateSellerRating}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* KYC Review Dialog */}
      <Dialog open={kycDialogOpen} onOpenChange={setKycDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Verification</DialogTitle>
            <DialogDescription>Review seller documents and approve or reject KYC</DialogDescription>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6">
              {/* Payout Details */}
              {selectedSeller.bankDetails && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-emerald-600" />
                    Payout Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 rounded-xl border p-4 bg-slate-50/50">
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Holder</p>
                      <p className="font-bold text-slate-900">{selectedSeller.bankDetails.accountHolder || 'Not Provided'}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Name</p>
                      <p className="font-bold text-slate-900">{selectedSeller.bankDetails.bankName || 'Not Provided'}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Number</p>
                      <p className="font-bold text-slate-900 font-mono tracking-widest">{selectedSeller.bankDetails.accountNumber || 'Not Provided'}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">IFSC Code</p>
                      <p className="font-bold text-slate-900 font-mono">{selectedSeller.bankDetails.ifscCode || 'Not Provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch</p>
                      <p className="font-bold text-slate-900">{selectedSeller.bankDetails.branchName || 'Not Provided'}</p>
                    </div>
                  </div>
                </div>
              )}

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{selectedSeller.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owner Name</p>
                  <p className="font-medium">{selectedSeller.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GST Number</p>
                  <p className="font-medium">{selectedSeller.gstNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PAN Number</p>
                  <p className="font-medium">{selectedSeller.panNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Account</p>
                  <p className="font-medium">{selectedSeller.bankDetails?.accountNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IFSC Code</p>
                  <p className="font-medium">{selectedSeller.bankDetails?.ifscCode || "Not provided"}</p>
                </div>
              </div>
              {/* Uploaded Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Submitted Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'PAN Card', key: 'pan' },
                    { label: 'Aadhaar', key: 'aadhaar' },
                    { label: 'Bank Proof', key: 'bankProof' },
                  ].map((doc) => (
                    <div key={doc.key} className="rounded-xl border p-4 bg-slate-50/50 flex flex-col gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{doc.label}</p>
                      <div className="flex items-center gap-2">
                        {selectedSeller.docs?.[doc.key] ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-bold text-slate-700 truncate">{selectedSeller.docs[doc.key]}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-slate-300" />
                            <span className="text-sm font-medium text-slate-400 italic">Not Uploaded</span>
                          </>
                        )}
                      </div>
                      {selectedSeller.docs?.[doc.key] && (
                        <Button variant="outline" size="sm" className="mt-2 text-[10px] font-black uppercase h-8 rounded-lg bg-white">
                          View File
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-600" />
                  Category Permissions
                </h3>
                <div className="grid gap-4 rounded-xl border p-4 bg-slate-50/50">
                  <div className="flex flex-col gap-2 mb-2">
                    <p className="text-sm font-medium">Seller Type: <Badge variant="outline" className="ml-2">{selectedSeller.sellerType || 'General'}</Badge></p>
                    <p className="text-sm font-medium text-muted-foreground">Intended Products: {selectedSeller.intendedProducts || 'None specified'}</p>
                  </div>
                  
                  {selectedSeller.pendingCategories?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Pending Requests</p>
                      <div className="flex flex-col gap-2">
                        {selectedSeller.pendingCategories.map(catId => {
                          const cat = categories.find(c => c.id === catId)
                          if (!cat) return null
                          return (
                            <div key={cat.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-100">
                              <span className="text-sm font-medium">{cat.name}</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => approveCategory(selectedSeller.id, cat.id)}>Approve</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50" onClick={() => rejectCategory(selectedSeller.id, cat.id)}>Reject</Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Approved Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeller.approvedCategories?.length > 0 ? (
                        selectedSeller.approvedCategories.map(catId => {
                          const cat = categories.find(c => c.id === catId)
                          return cat ? (
                            <Badge key={cat.id} className="bg-emerald-100 text-emerald-700 pr-1 py-1">
                              {cat.name}
                              <button className="ml-1 hover:text-emerald-900" onClick={() => rejectCategory(selectedSeller.id, cat.id)}><XCircle className="h-3 w-3" /></button>
                            </Badge>
                          ) : null
                        })
                      ) : <span className="text-sm text-slate-400">None</span>}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-600">Restricted Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeller.restrictedCategories?.length > 0 ? (
                        selectedSeller.restrictedCategories.map(catId => {
                          const cat = categories.find(c => c.id === catId)
                          return cat ? (
                            <Badge key={cat.id} className="bg-red-100 text-red-700 pr-1 py-1">
                              {cat.name}
                              <button className="ml-1 hover:text-red-900" onClick={() => approveCategory(selectedSeller.id, cat.id)}><CheckCircle className="h-3 w-3" /></button>
                            </Badge>
                          ) : null
                        })
                      ) : <span className="text-sm text-slate-400">None</span>}
                    </div>
                  </div>

                </div>
              </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                rejectKYC(selectedSeller.id)
                setKycDialogOpen(false)
              }}
            >
              Reject KYC
            </Button>
            <Button 
              onClick={() => {
                approveKYC(selectedSeller.id)
                setKycDialogOpen(false)
              }}
            >
              Approve KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SellerTable({
  sellers,
  onViewKYC,
  onToggleStatus,
  products,
  calculateSellerRating,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Seller</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Total Sales</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>KYC Status</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sellers.map((seller) => (
          <TableRow key={seller.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {seller.businessName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{seller.businessName}</p>
                  <p className="text-sm text-muted-foreground">{seller.ownerName}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{seller.location}</TableCell>
            <TableCell>{products.filter(p => p.sellerId === seller.id).length}</TableCell>
            <TableCell>Rs. {((seller.totalSales || 0) / 1000).toFixed(0)}k</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{calculateSellerRating(products, seller.id)}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  seller.kycStatus === "verified"
                    ? "default"
                    : seller.kycStatus === "pending"
                      ? "secondary"
                      : "destructive"
                }
              >
                {seller.kycStatus}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={seller.status === "active" ? "default" : "destructive"}
              >
                {seller.status}
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
                  <DropdownMenuItem onClick={() => onViewKYC(seller)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewKYC(seller)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Review KYC
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={seller.status === 'active' ? "text-destructive" : "text-green-600"}
                    onClick={() => onToggleStatus(seller.id)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {seller.status === 'active' ? "Suspend Seller" : "Activate Seller"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}





