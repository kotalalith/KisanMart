'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { Skeleton } from '@/components/ui/skeleton'
import { getActiveDeliveryUid } from '@/lib/walletService'
import { useWallet } from '@/hooks/useWallet'

export default function DeliveryProtectedRoute({ children }) {
  const router = useRouter()
  const [resolvedUid, setResolvedUid] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const { uid, wallet, profile, loading } = useWallet(resolvedUid)

  useEffect(() => {
    const fallbackUid = getActiveDeliveryUid()
    if (fallbackUid) {
      setResolvedUid(fallbackUid)
      setAuthChecked(true)
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) setResolvedUid(user.uid)
      setAuthChecked(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (authChecked && !resolvedUid) router.replace('/delivery/login')
  }, [authChecked, resolvedUid, router])

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!uid || !profile) return null

  return children({ uid, wallet, profile })
}
