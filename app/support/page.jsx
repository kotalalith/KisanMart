'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSupport } from '@/lib/support-context'
import { BuyerHeader } from '@/components/buyer/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  LifeBuoy, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react'

export default function CustomerCarePage() {
  const { submitTicket } = useSupport()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: 'Rajesh Kumar', 
    phone: '+91 98765 43210',
    subject: orderId ? `Issue with Order ${orderId}` : '',
    message: '',
    category: orderId ? 'Delivery Issue' : 'General Inquiry',
    orderId: orderId || ''
  })

  // Update subject if orderId changes (e.g. on mount)
  useEffect(() => {
    if (orderId) {
      setFormData(prev => ({
        ...prev,
        orderId: orderId,
        subject: `Issue with Order ${orderId}`,
        category: 'Delivery Issue'
      }))
    }
  }, [orderId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submitTicket(formData)
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BuyerHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">How can we help?</h1>
          <p className="text-lg text-slate-600">Our team is here to support you with any issues on the platform.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-12">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-1">Fast Response</h3>
              <p className="text-xs text-slate-500">We usually reply within 2-4 hours during business days.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-1">Safe Transactions</h3>
              <p className="text-xs text-slate-500">All payments are protected by our escrow system.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-1">Dispute Resolution</h3>
              <p className="text-xs text-slate-500">Unsatisfied with a product? File a claim instantly.</p>
            </CardContent>
          </Card>
        </div>

        {isSubmitted ? (
          <Card className="border-none shadow-2xl bg-white max-w-lg mx-auto">
            <CardContent className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Message Received!</h2>
                <p className="text-slate-600 mt-2">Your support ticket has been created. Admin will review your issue and get back to you shortly.</p>
              </div>
              <Button onClick={() => setIsSubmitted(false)} variant="outline">Submit another request</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-1">
            <Card className="border-none shadow-2xl bg-white overflow-hidden">
              <div className="bg-primary h-2 w-full" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <LifeBuoy className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Submit a Complaint</CardTitle>
                    <CardDescription>Fill out the form below and we will look into it.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Issue Category</label>
                      <select 
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                      >
                        <option>Delivery Issue</option>
                        <option>Payment/Refund</option>
                        <option>Product Quality</option>
                        <option>Seller Behavior</option>
                        <option>App Bug</option>
                        <option>General Inquiry</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Subject</label>
                      <Input 
                        placeholder="Briefly describe the problem" 
                        required 
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Detailed Message</label>
                    <Textarea 
                      placeholder="Please provide as much detail as possible so we can help you faster..." 
                      className="min-h-[150px]"
                      required 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-bold gap-2">
                    <Send className="h-5 w-5" /> SEND MESSAGE
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
