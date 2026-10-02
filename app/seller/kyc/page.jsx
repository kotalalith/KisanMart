'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Upload, FileText, AlertCircle, Shield, Building2, User, CreditCard, Banknote, Landmark, FileCheck, Store } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useSellers, SELLER_TYPES } from '@/lib/seller-context'
import { categories } from '@/lib/mock-data'
import { toast } from 'sonner'

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: FileText },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertCircle },
}

export default function KYCPage() {
  const { currentSeller, submitKYC } = useSellers()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    panNumber: '',
    gstNumber: '',
    bankDetails: {
      accountHolder: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: ''
    },
    docs: {
      pan: null,
      aadhaar: null,
      bankProof: null
    },
    sellerType: '',
    intendedProducts: ''
  })

  useEffect(() => {
    if (currentSeller) {
      setFormData({
        businessName: currentSeller.businessName || '',
        ownerName: currentSeller.ownerName || '',
        panNumber: currentSeller.panNumber || '',
        gstNumber: currentSeller.gstNumber || '',
        bankDetails: {
          accountHolder: currentSeller.bankDetails?.accountHolder || '',
          bankName: currentSeller.bankDetails?.bankName || '',
          accountNumber: currentSeller.bankDetails?.accountNumber || '',
          ifscCode: currentSeller.bankDetails?.ifscCode || '',
          branchName: currentSeller.bankDetails?.branchName || ''
        },
        docs: {
          pan: currentSeller.docs?.pan || null,
          aadhaar: currentSeller.docs?.aadhaar || null,
          bankProof: currentSeller.docs?.bankProof || null
        },
        sellerType: currentSeller.sellerType || '',
        intendedProducts: currentSeller.intendedProducts || ''
      })
    }
  }, [currentSeller])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        docs: {
          ...prev.docs,
          [docType]: file.name // Simulating upload by storing filename
        }
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Determine default categories to request based on type
      let categoriesToRequest = []
      if (formData.sellerType && SELLER_TYPES[formData.sellerType.toUpperCase()]) {
        categoriesToRequest = SELLER_TYPES[formData.sellerType.toUpperCase()].defaultCategories
      }
      
      await submitKYC(currentSeller.id, {
        ...formData,
        pendingCategories: categoriesToRequest
      })
      setIsEditing(false)
      toast.success('KYC details and documents submitted successfully! Waiting for admin approval.')
    } catch (error) {
      console.error("KYC submission error:", error)
      toast.error('Failed to submit KYC details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentSeller) return <div>Loading...</div>

  const kycSteps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Name, email, phone verification',
      status: 'completed',
    },
    {
      id: 'business',
      title: 'Business Details',
      description: 'Business name, type, address',
      status: currentSeller.kycStatus === 'pending' || currentSeller.kycStatus === 'verified' || currentSeller.businessName ? 'completed' : 'pending',
    },
    {
      id: 'documents',
      title: 'Bank & Tax Verification',
      description: 'PAN, GST, Bank details',
      status: currentSeller.kycStatus === 'pending' || currentSeller.kycStatus === 'verified' || currentSeller.panNumber ? 'completed' : 'pending',
    },
    {
      id: 'review',
      title: 'Admin Review',
      description: 'Final verification by admin',
      status: currentSeller.kycStatus === 'verified' ? 'completed' : 'pending',
    },
  ]

  const completedSteps = kycSteps.filter((s) => s.status === 'completed').length
  const progress = (completedSteps / kycSteps.length) * 100
  const kycStatus = statusConfig[currentSeller.kycStatus] || statusConfig.pending

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">KYC Verification</h1>
          <p className="text-slate-500 font-medium">Complete your identity and business verification to unlock all features</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6 font-black italic shadow-lg shadow-emerald-600/20">
            {currentSeller.kycStatus === 'verified' ? 'Update Verified Details' : currentSeller.kycStatus === 'rejected' ? 'Re-submit KYC' : 'Update Details'}
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Progress & Steps */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[32px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Verification Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className={`rounded-2xl p-4 ${kycStatus.color} shadow-inner`}>
                  <Shield className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{kycStatus.label}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {completedSteps} of 4</p>
                </div>
              </div>
              <Progress value={progress} className="h-2.5 rounded-full bg-slate-100" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[32px] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {kycSteps.map((step, index) => (
                  <div key={step.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${step.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                        {step.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-black">{index + 1}</span>}
                      </div>
                      {index < kycSteps.length - 1 && (
                        <div className={`w-0.5 h-10 my-2 rounded-full ${step.status === 'completed' ? 'bg-emerald-200' : 'bg-slate-100'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-black tracking-tight ${step.status === 'completed' ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</p>
                      <p className="text-[11px] font-medium text-slate-400 line-clamp-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Form */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[40px] overflow-hidden">
              <form onSubmit={handleSubmit}>
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight">KYC Submission Form</CardTitle>
                  <CardDescription className="text-slate-400 font-bold">Please update your business and bank details below.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-10">
                  {/* Business Info Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 italic">
                      <Building2 className="h-5 w-5 text-emerald-500" />
                      Business Information
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Name</Label>
                        <Input 
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="e.g. Green Valley Farms"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Owner Name</Label>
                        <Input 
                          name="ownerName"
                          value={formData.ownerName}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="Full Name as per PAN"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">PAN Number</Label>
                        <Input 
                          name="panNumber"
                          value={formData.panNumber}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="ABCDE1234F"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">GST Number (Optional)</Label>
                        <Input 
                          name="gstNumber"
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Seller Type</Label>
                        <Select value={formData.sellerType} onValueChange={(val) => handleInputChange({ target: { name: 'sellerType', value: val }})}>
                          <SelectTrigger className="rounded-2xl h-12 bg-slate-50/50 border-none font-bold">
                            <SelectValue placeholder="Select your seller type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(SELLER_TYPES).map(type => (
                              <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.sellerType && SELLER_TYPES[formData.sellerType.toUpperCase()] && (
                          <p className="text-[10px] text-emerald-600 font-bold ml-1 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Default Categories: {SELLER_TYPES[formData.sellerType.toUpperCase()].defaultCategories.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Products You Intend To Sell</Label>
                        <Textarea 
                          name="intendedProducts"
                          value={formData.intendedProducts}
                          onChange={handleInputChange}
                          className="rounded-2xl bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-medium resize-none" 
                          placeholder="List specific products you plan to list (e.g. Alphonso Mangoes, Raw Forest Honey...)"
                          rows={3}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 italic">
                      <Landmark className="h-5 w-5 text-emerald-500" />
                      Bank Account Payouts
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Holder Name</Label>
                        <Input 
                          name="bankDetails.accountHolder"
                          value={formData.bankDetails.accountHolder}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="As per bank records"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Bank Name</Label>
                        <Input 
                          name="bankDetails.bankName"
                          value={formData.bankDetails.bankName}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="e.g. HDFC Bank"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Number</Label>
                        <Input 
                          name="bankDetails.accountNumber"
                          value={formData.bankDetails.accountNumber}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold font-mono" 
                          placeholder="000000000000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">IFSC Code</Label>
                        <Input 
                          name="bankDetails.ifscCode"
                          value={formData.bankDetails.ifscCode}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="HDFC0001234"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Branch Name</Label>
                        <Input 
                          name="bankDetails.branchName"
                          value={formData.bankDetails.branchName}
                          onChange={handleInputChange}
                          className="rounded-2xl h-12 bg-slate-50/50 border-none focus-visible:ring-emerald-500 font-bold" 
                          placeholder="Main Branch, City"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 italic">
                      <Upload className="h-5 w-5 text-emerald-500" />
                      Document Uploads
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {[
                        { id: 'pan', label: 'PAN Card Copy' },
                        { id: 'aadhaar', label: 'Aadhaar Card' },
                        { id: 'bankProof', label: 'Bank Passbook/Cheque' },
                      ].map((doc) => (
                        <div key={doc.id} className="space-y-2">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{doc.label}</Label>
                          <div className={`relative group border-2 border-dashed rounded-[24px] p-6 transition-all duration-500 ${formData.docs[doc.id] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50/50 border-slate-200 hover:border-emerald-300'}`}>
                            <input 
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                              onChange={(e) => handleFileChange(e, doc.id)}
                            />
                            <div className="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
                              {formData.docs[doc.id] ? (
                                <>
                                  <FileCheck className="h-8 w-8 text-emerald-500" />
                                  <p className="text-xs font-black text-emerald-600 line-clamp-1">{formData.docs[doc.id]}</p>
                                  <p className="text-[10px] font-bold text-emerald-400">Ready to submit</p>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                                  <p className="text-xs font-bold text-slate-400">Click or drag to upload</p>
                                  <p className="text-[10px] font-medium text-slate-300">PDF, JPG or PNG (Max 5MB)</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 bg-slate-50/50 flex justify-end gap-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-2xl font-black italic">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-8 font-black italic shadow-lg shadow-emerald-600/20">
                    {isSubmitting ? 'Submitting...' : 'Submit All Details'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Display Current Profile */}
              <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-md rounded-[40px] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tight">Business Profile</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  <div className="grid gap-8 md:grid-cols-2">
                    {[
                      { label: 'Business Name', value: currentSeller.businessName, icon: Building2 },
                      { label: 'Seller Type', value: SELLER_TYPES[currentSeller.sellerType?.toUpperCase()]?.label || 'General Seller', icon: Store },
                      { label: 'Owner Name', value: currentSeller.ownerName, icon: User },
                      { label: 'PAN Number', value: currentSeller.panNumber, icon: FileText },
                      { label: 'GST Number', value: currentSeller.gstNumber || 'Not Provided', icon: Shield },
                    ].map((item) => (
                      <div key={item.label} className="group">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">{item.label}</p>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/50 group-hover:bg-emerald-50 transition-colors duration-500">
                          <item.icon className="h-5 w-5 text-emerald-500" />
                          <span className="text-base font-black text-slate-900">{item.value || '---'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Documents Display */}
                  <div className="pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Submitted Documents</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        { label: 'PAN Card', key: 'pan' },
                        { label: 'Aadhaar Card', key: 'aadhaar' },
                        { label: 'Bank Proof', key: 'bankProof' },
                      ].map((doc) => (
                        <div key={doc.key} className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">{doc.label}</p>
                          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="h-4 w-4 text-slate-300" />
                              <span className="text-xs font-bold text-slate-600 truncate">{currentSeller.docs?.[doc.key] || 'Not Uploaded'}</span>
                            </div>
                            {currentSeller.docs?.[doc.key] && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 italic">
                      <Landmark className="h-6 w-6 text-emerald-500" />
                      Verified Payout Account
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 bg-slate-950 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-950/20">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Banknote className="h-32 w-32" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Account Holder</p>
                        <p className="text-xl font-black tracking-tight">{currentSeller.bankDetails?.accountHolder || '---'}</p>
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Bank Name</p>
                        <p className="text-xl font-black tracking-tight">{currentSeller.bankDetails?.bankName || '---'}</p>
                      </div>
                      <div className="relative z-10 md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Account Number</p>
                        <p className="text-2xl font-black tracking-[0.3em] font-mono">{currentSeller.bankDetails?.accountNumber?.replace(/\d(?=\d{4})/g, "*") || '**** **** ****'}</p>
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">IFSC Code</p>
                        <p className="text-lg font-black tracking-widest uppercase">{currentSeller.bankDetails?.ifscCode || '---'}</p>
                      </div>
                      <div className="relative z-10 text-right flex flex-col justify-end">
                        <div className="flex justify-end gap-1 mb-1">
                          <div className="h-4 w-4 rounded-full bg-emerald-500/80" />
                          <div className="h-4 w-4 rounded-full bg-emerald-400/50 -ml-2" />
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Secure AgroBridge Partner</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}






