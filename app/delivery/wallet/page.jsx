'use client'

import DeliveryProtectedRoute from '@/components/delivery/DeliveryProtectedRoute'
import WalletDashboard from '@/components/delivery/WalletDashboard'

export default function DeliveryWalletPage() {
  return (
    <DeliveryProtectedRoute>
      {({ uid, wallet, profile }) => <WalletDashboard uid={uid} wallet={wallet} profile={profile} />}
    </DeliveryProtectedRoute>
  )
}
