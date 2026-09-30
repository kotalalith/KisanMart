'use client'

import DeliveryProtectedRoute from '@/components/delivery/DeliveryProtectedRoute'
import WithdrawPage from '@/components/delivery/WithdrawPage'

export default function DeliveryWithdrawPage() {
  return (
    <DeliveryProtectedRoute>
      {({ uid, wallet, profile }) => <WithdrawPage uid={uid} wallet={wallet} profile={profile} />}
    </DeliveryProtectedRoute>
  )
}
