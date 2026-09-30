'use client'

import { IndianRupee, Clock, CheckCircle2, ArrowUpRight, Download, Wallet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOrders } from '@/lib/order-context'
import { calculatePayoutBreakdown } from '@/lib/payout-utils'

const payoutStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  shipped: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Clock },
  delivered: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
}

export default function PaymentsPage() {
  const { orders } = useOrders()
  const sellerId = 'seller-1'

  // Filter orders that contain items from this seller
  const sellerOrders = orders.filter(order => 
    order.items.some(item => item.sellerId === sellerId)
  )

  // Map orders to payment records - exclude voided ones from calculations
  const realTimePayments = sellerOrders
    .filter(order => !['cancelled', 'returned', 'return_requested'].includes(order.status))
    .filter(order => order.paymentStatus !== 'Rejected' && order.paymentStatus !== 'Pending Verification')
    .map(order => {
      const sellerItems = order.items.filter(item => item.sellerId === sellerId)
      const itemTotal = sellerItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0)
      
      const { subtotal, platformFee, sellerPayout } = calculatePayoutBreakdown(itemTotal)
      
      return {
        id: order.id,
        transactionId: `TXN-${order.orderNumber.split('-')[2]}`,
        orderNumber: order.orderNumber,
        buyerName: order.buyerName || 'Guest Customer',
        amount: subtotal,
        platformFee,
        sellerPayout,
        payoutStatus: order.status === 'delivered' ? 'completed' : 'processing',
        createdAt: order.createdAt
      }
    })

  const pendingAmount = realTimePayments
    .filter((p) => p.payoutStatus === 'processing')
    .reduce((sum, p) => sum + p.sellerPayout, 0)

  const completedAmount = realTimePayments
    .filter((p) => p.payoutStatus === 'completed')
    .reduce((sum, p) => sum + p.sellerPayout, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Track your earnings and payouts
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Statement
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Rs. {pendingAmount.toLocaleString()}</div>
            <Button size="sm" className="mt-2 gap-1">
              <ArrowUpRight className="h-3 w-3" />
              Withdraw
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Orders being processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {completedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Fee
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5%</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Account</CardTitle>
          <CardDescription>Your linked bank account for payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">State Bank of India</p>
                <p className="text-sm text-muted-foreground">
                  Account ending in ****7890
                </p>
                <p className="text-xs text-muted-foreground">IFSC: SBIN0001234</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead>Your Earnings</TableHead>
                <TableHead>Payout Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {realTimePayments.map((payment) => {
                const status = payoutStatusConfig[payment.payoutStatus]
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.transactionId || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.orderNumber}
                    </TableCell>
                    <TableCell>{payment.buyerName}</TableCell>
                    <TableCell>Rs. {payment.amount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      -Rs. {payment.platformFee}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      Rs. {payment.sellerPayout}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <status.icon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}





