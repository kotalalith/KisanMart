'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function FirebaseSetupPage() {
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  const initializeCollections = async () => {
    setStatus('loading')
    setMessage('Creating collections and adding sample data...')

    try {
      // 1. Initialize Buyers
      await addDoc(collection(db, "buyers"), {
        name: "Sample Buyer",
        email: "buyer@example.com",
        phone: "9876543210",
        location: "Hyderabad",
        createdAt: serverTimestamp()
      })

      // 2. Initialize Sellers
      const sellerRef = await addDoc(collection(db, "sellers"), {
        name: "Sample Farmer",
        email: "farmer@example.com",
        phone: "9123456789",
        location: "Guntur",
        shopName: "Green Farms",
        createdAt: serverTimestamp()
      })

      // 3. Initialize Products
      await addDoc(collection(db, "products"), {
        name: "Organic Tomatoes",
        price: 40,
        unit: "kg",
        category: "Vegetables",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        sellerId: sellerRef.id,
        createdAt: serverTimestamp()
      })

      setStatus('success')
      setMessage('Collections initialized successfully! Check your Firebase Console.')
    } catch (error) {
      console.error("Initialization error:", error)
      setStatus('error')
      setMessage('Error: ' + error.message)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Firebase Initialization</CardTitle>
          <CardDescription>
            Click the button below to create the necessary collections (Buyers, Sellers, Products) in your Firestore database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' ? (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          ) : status === 'error' ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{message}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Firestore collections are created automatically when data is first added.
            </p>
          )}

          <Button 
            onClick={initializeCollections} 
            className="w-full" 
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : 'Initialize Firestore Collections'}
          </Button>
          
          {status === 'success' && (
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/admin'}>
              Go to Admin Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
