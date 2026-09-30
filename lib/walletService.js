'use client'

import { auth, db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

export const SECURITY_DEPOSIT_AMOUNT = 500
export const UPI_ID = process.env.NEXT_PUBLIC_ANTIGRAVITY_UPI_ID || 'YOUR_UPI_ID'

export function getActiveDeliveryUid() {
  if (auth.currentUser?.uid) return auth.currentUser.uid
  if (typeof window !== 'undefined') return localStorage.getItem('agro_test_uid')
  return null
}

export function getUpiPaymentLink(amount = SECURITY_DEPOSIT_AMOUNT, purpose = 'Wallet Topup') {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: 'AgroLogistics',
    am: String(amount),
    cu: 'INR',
    tn: purpose,
  })

  return `upi://pay?${params.toString()}`
}

export function currentISOWeek(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  const week = Math.ceil((((date - start) / 86400000) + start.getDay() + 1) / 7)
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function nextSunday(date = new Date()) {
  const next = new Date(date)
  const daysUntilSunday = (7 - next.getDay()) % 7 || 7
  next.setDate(next.getDate() + daysUntilSunday)
  return next
}

export function normalizeWallet(wallet = {}) {
  return {
    isActivated: Boolean(wallet.isActivated),
    balance: Number(wallet.balance || 0),
    depositPaid: Number(wallet.depositPaid || 0),
    totalEarned: Number(wallet.totalEarned || 0),
    depositPending: Boolean(wallet.depositPending),
    depositAmount: Number(wallet.depositAmount || SECURITY_DEPOSIT_AMOUNT),
    withdrawalPending: Boolean(wallet.withdrawalPending),
    lastWithdrawalWeek: wallet.lastWithdrawalWeek || '',
    depositRequestedAt: wallet.depositRequestedAt || null,
  }
}

export function subscribeToPartnerWallet(uid, callback, onError) {
  if (!uid) return () => {}

  return onSnapshot(
    doc(db, 'delivery_partners', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({ profile: null, wallet: normalizeWallet() })
        return
      }

      const data = snapshot.data()
      callback({
        profile: { id: snapshot.id, ...data },
        wallet: normalizeWallet(data.wallet),
      })
    },
    onError,
  )
}

export function subscribeToRecentTransactions(uid, callback, count = 5, onError) {
  if (!uid) return () => {}

  const transactionsQuery = query(
    collection(db, 'delivery_partners', uid, 'transactions'),
    orderBy('timestamp', 'desc'),
    limit(count),
  )

  return onSnapshot(
    transactionsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  )
}

export function subscribeToTransactions(uid, callback, onError) {
  if (!uid) return () => {}

  const transactionsQuery = query(
    collection(db, 'delivery_partners', uid, 'transactions'),
    orderBy('timestamp', 'desc'),
  )

  return onSnapshot(
    transactionsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  )
}

export async function notifySecurityDepositPaid(uid) {
  await updateDoc(doc(db, 'delivery_partners', uid), {
    'wallet.depositPending': true,
    'wallet.depositAmount': SECURITY_DEPOSIT_AMOUNT,
    'wallet.depositRequestedAt': serverTimestamp(),
  })
}

export async function requestWithdrawal({ uid, profile, amount, upiId }) {
  const requestRef = await addDoc(collection(db, 'withdrawal_requests'), {
    uid,
    displayName: profile?.name || profile?.displayName || 'Delivery Partner',
    phone: profile?.phone || '',
    amount: Number(amount),
    upiId,
    requestedAt: serverTimestamp(),
    status: 'pending',
  })

  const batch = writeBatch(db)
  batch.update(doc(db, 'delivery_partners', uid), {
    'wallet.lastWithdrawalWeek': currentISOWeek(),
    'wallet.withdrawalPending': true,
    upiId: upiId,
  })
  batch.set(doc(collection(db, 'delivery_partners', uid, 'transactions')), {
    type: 'withdrawal',
    amount: Number(amount),
    description: 'Weekly withdrawal request',
    timestamp: serverTimestamp(),
    status: 'pending',
    withdrawalRequestId: requestRef.id,
  })

  await batch.commit()
  return requestRef.id
}

export async function updateSavedPaymentMethods(uid, savedPaymentMethods) {
  await updateDoc(doc(db, 'delivery_partners', uid), {
    savedPaymentMethods
  })
}

export function subscribeToPendingDeposits(callback, onError) {
  const depositsQuery = query(
    collection(db, 'delivery_partners'),
    where('wallet.depositPending', '==', true),
  )

  return onSnapshot(
    depositsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  )
}

export async function approveDeposit(uid) {
  const batch = writeBatch(db)
  const partnerRef = doc(db, 'delivery_partners', uid)

  batch.update(partnerRef, {
    'wallet.isActivated': true,
    'wallet.depositPending': false,
    'wallet.balance': 0,
    'wallet.depositPaid': SECURITY_DEPOSIT_AMOUNT,
    'wallet.depositAmount': SECURITY_DEPOSIT_AMOUNT,
    'wallet.updatedAt': serverTimestamp(),
  })
  batch.set(doc(collection(db, 'delivery_partners', uid, 'transactions')), {
    type: 'deposit',
    amount: SECURITY_DEPOSIT_AMOUNT,
    description: 'Security deposit approved',
    timestamp: serverTimestamp(),
    status: 'completed',
  })

  await batch.commit()
}

export async function rejectDeposit(uid, reason) {
  await updateDoc(doc(db, 'delivery_partners', uid), {
    'wallet.depositPending': false,
    'wallet.depositRejectedReason': reason || 'Not approved by admin',
    'wallet.depositRejectedAt': serverTimestamp(),
  })
}

export function subscribeToPendingWithdrawals(callback, onError) {
  const withdrawalsQuery = query(
    collection(db, 'withdrawal_requests'),
    where('status', '==', 'pending'),
  )

  return onSnapshot(
    withdrawalsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  )
}

export async function approveWithdrawal(request) {
  const batch = writeBatch(db)
  const requestRef = doc(db, 'withdrawal_requests', request.id)
  const partnerRef = doc(db, 'delivery_partners', request.uid)

  batch.update(requestRef, {
    status: 'approved',
    processedAt: serverTimestamp(),
  })
  batch.update(partnerRef, {
    'wallet.balance': increment(-Number(request.amount || 0)),
    'wallet.withdrawalPending': false,
  })

  const relatedTransactions = await getDocs(query(
    collection(db, 'delivery_partners', request.uid, 'transactions'),
    where('withdrawalRequestId', '==', request.id),
  ))

  relatedTransactions.forEach((item) => {
    batch.update(item.ref, {
      status: 'completed',
      timestamp: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function rejectWithdrawal(request, reason) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'withdrawal_requests', request.id), {
    status: 'rejected',
    rejectedReason: reason || 'Rejected by admin',
    processedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'delivery_partners', request.uid), {
    'wallet.withdrawalPending': false,
  })

  const relatedTransactions = await getDocs(query(
    collection(db, 'delivery_partners', request.uid, 'transactions'),
    where('withdrawalRequestId', '==', request.id),
  ))

  relatedTransactions.forEach((item) => {
    batch.update(item.ref, {
      status: 'failed',
      timestamp: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function getPartnerProfile(uid) {
  const snapshot = await getDoc(doc(db, 'delivery_partners', uid))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function addMoneyToWallet(uid, amount) {
  const batch = writeBatch(db)
  const partnerRef = doc(db, 'delivery_partners', uid)

  batch.update(partnerRef, {
    'wallet.isActivated': true,
    'wallet.balance': increment(Number(amount)),
    'wallet.updatedAt': serverTimestamp(),
  })
  batch.set(doc(collection(db, 'delivery_partners', uid, 'transactions')), {
    type: 'deposit',
    amount: Number(amount),
    description: 'Wallet top-up via UPI',
    timestamp: serverTimestamp(),
    status: 'completed',
  })

  await batch.commit()
}
