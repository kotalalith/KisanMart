'use client'

import { useState } from 'react'
import { useSupport } from '@/lib/support-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Tag,
  Eye,
  Package,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export default function AdminSupportPage() {
  const { tickets, loading, updateTicketStatus } = useSupport()
  const [selectedTicket, setSelectedTicket] = useState(null)

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">New</Badge>
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">In Progress</Badge>
      case 'resolved': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Resolved</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Care Center</h1>
          <p className="text-muted-foreground">Manage and resolve user complaints and inquiries</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-900">New Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{tickets.filter(t => t.status === 'open').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-900">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{tickets.filter(t => t.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-900">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{tickets.filter(t => t.status === 'resolved').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Support Tickets</CardTitle>
          <CardDescription>All incoming messages from buyers and sellers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                    No support tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{ticket.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{ticket.name}</span>
                        <span className="text-[10px] text-muted-foreground">{ticket.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm font-medium">{ticket.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl border-2">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(selectedTicket.status)}
                <Badge variant="outline">{selectedTicket.category}</Badge>
              </div>
              <DialogTitle className="text-2xl">{selectedTicket.subject}</DialogTitle>
              <DialogDescription>
                Ticket ID: {selectedTicket.id} | Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{selectedTicket.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedTicket.phone}</span>
                </div>
                {selectedTicket.orderId && (
                  <div className="flex items-center gap-2 border-l pl-6">
                    <Package className="h-4 w-4 text-amber-600" />
                    <Link href={`/admin/orders?search=${selectedTicket.orderId}`}>
                      <Badge variant="outline" className="cursor-pointer border-amber-200 bg-amber-50 text-amber-700 gap-1 hover:bg-amber-100 transition-colors">
                        Order: {selectedTicket.orderId}
                        <ExternalLink className="h-2 w-2" />
                      </Badge>
                    </Link>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Message</p>
                <div className="bg-card p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'in_progress')
                    setSelectedTicket(null)
                  }}
                >
                  Mark In Progress
                </Button>
                <Button 
                  variant="outline" 
                  className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                  onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'resolved')
                    setSelectedTicket(null)
                  }}
                >
                  Mark Resolved
                </Button>
              </div>
              <Button onClick={() => setSelectedTicket(null)}>Close Audit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
