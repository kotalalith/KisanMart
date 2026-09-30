"use client"

import { useState, useEffect } from "react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Eye,
  Users,
  UserPlus,
  ShieldCheck,
  Loader2,
  Wallet,
} from "lucide-react"
import { useAdminUsers } from "@/lib/admin-users-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, doc, updateDoc, increment, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const { users, loading, updateUserStatus } = useAdminUsers()
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedUserForWallet, setSelectedUserForWallet] = useState(null)
  const [adjustmentAmount, setAdjustmentAmount] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [userTransactions, setUserTransactions] = useState([])

  useEffect(() => {
    if (!selectedUserForWallet) {
      setUserTransactions([])
      return
    }
    
    const q = query(
      collection(db, "wallet_transactions"),
      where("userId", "==", selectedUserForWallet.id)
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setUserTransactions(list)
    })
    
    return () => unsubscribe()
  }, [selectedUserForWallet])

  const handleWalletAdjustment = async (userId, userColl, amount, reason) => {
    try {
      const userRef = doc(db, userColl, userId)
      await updateDoc(userRef, {
        walletBalance: increment(amount),
        updatedAt: serverTimestamp()
      })
      
      const txRef = doc(collection(db, "wallet_transactions"))
      await setDoc(txRef, {
        id: txRef.id,
        userId: userId,
        type: amount >= 0 ? 'credit' : 'debit',
        amount: Math.abs(amount),
        note: reason || 'Admin adjustment',
        createdAt: new Date().toISOString()
      })
      
      toast.success("Wallet balance adjusted successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to adjust wallet balance")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage buyer accounts and permissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "active" || !u.status).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.isVerified).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "suspended").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>A list of all registered buyers on the platform</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {(user.name || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name || "Unknown User"}</p>
                        <p className="text-sm text-muted-foreground">{user.email || "No Email"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.phone || "N/A"}</TableCell>
                  <TableCell>
                    {user.addresses?.find(a => a.isDefault)?.city || "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground" suppressHydrationWarning>
                    {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('en-GB') : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "suspended" ? "destructive" : "default"}
                    >
                      {user.status || "active"}
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedUserForWallet(user)}>
                          <Wallet className="mr-2 h-4 w-4" />
                          Manage Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem className={user.status === 'suspended' ? "text-green-600" : "text-destructive"} onClick={() => updateUserStatus(user.id, user.status === 'suspended' ? 'active' : 'suspended')}>
                          <UserX className="mr-2 h-4 w-4" />
                          {user.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Wallet Management Dialog */}
      {selectedUserForWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-[500px] max-w-full rounded-[24px] bg-white shadow-2xl p-6 border-none overflow-hidden relative">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  Manage Wallet Credit
                </CardTitle>
                <CardDescription className="text-xs">
                  Adjust balance and view transaction logs for {selectedUserForWallet.name}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedUserForWallet(null)} 
                className="h-8 w-8 p-0 rounded-full font-black"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Balance Display */}
              <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Current Balance</span>
                  <div className="text-2xl font-black text-emerald-950">₹ {selectedUserForWallet.walletBalance ?? 0}</div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">Active Wallet</Badge>
              </div>
              
              {/* Adjust Balance Form */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400">Make Balance Adjustment</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Amount (₹)</label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 100 or -50"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Reason / Notes</label>
                    <Input 
                      placeholder="e.g. Courtesy credit" 
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={async () => {
                    const amt = parseFloat(adjustmentAmount)
                    if (isNaN(amt)) {
                      toast.error("Please enter a valid amount")
                      return
                    }
                    if (!adjustmentReason.trim()) {
                      toast.error("Please provide an adjustment reason")
                      return
                    }
                    
                    await handleWalletAdjustment(selectedUserForWallet.id, selectedUserForWallet.collection, amt, adjustmentReason)
                    
                    setAdjustmentAmount("")
                    setAdjustmentReason("")
                    
                    setSelectedUserForWallet(prev => ({
                      ...prev,
                      walletBalance: (prev.walletBalance ?? 0) + amt
                    }))
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold text-sm shadow-md"
                >
                  Adjust Balance
                </Button>
              </div>
              
              {/* Transaction History Logs */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400">Transaction History Log</h4>
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {userTransactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No transactions recorded for this wallet.</p>
                  ) : (
                    userTransactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-100 text-[11px]">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">{tx.note}</span>
                          <div className="text-[9px] text-slate-400 font-medium">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</div>
                        </div>
                        <span className={`font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}





