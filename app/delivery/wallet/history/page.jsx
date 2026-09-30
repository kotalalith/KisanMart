'use client'

import DeliveryProtectedRoute from '@/components/delivery/DeliveryProtectedRoute'
import TransactionHistory from '@/components/delivery/TransactionHistory'

export default function DeliveryWalletHistoryPage() {
  return (
    <DeliveryProtectedRoute>
      {({ uid }) => <TransactionHistory uid={uid} />}
    </DeliveryProtectedRoute>
  )
}
