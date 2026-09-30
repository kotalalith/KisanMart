'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getActiveDeliveryUid, normalizeWallet, subscribeToPartnerWallet } from '@/lib/walletService'

export function useWallet(providedUid) {
  const [uid, setUid] = useState(providedUid || null)
  const [wallet, setWallet] = useState(normalizeWallet())
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setUid(providedUid || getActiveDeliveryUid())
  }, [providedUid])

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const unsubscribe = subscribeToPartnerWallet(
      uid,
      ({ profile: nextProfile, wallet: nextWallet }) => {
        setProfile(nextProfile)
        setWallet(nextWallet)
        setLoading(false)
      },
      (err) => {
        console.error('Wallet sync error:', err)
        setError(err)
        setLoading(false)
        toast.error('Could not load wallet data')
      },
    )

    return unsubscribe
  }, [uid])

  return { uid, wallet, profile, loading, error }
}
