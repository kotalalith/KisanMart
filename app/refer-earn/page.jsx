'use client'

import { useState, useEffect } from 'react'
import { 
  Wallet,
  Share2,
  Copy,
  Check,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Gift
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/user-context'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'

export default function ReferEarnPage() {
  const { userProfile, loading, applyReferralCode } = useUser()
  const [invites, setInvites] = useState([])
  const [walletTransactions, setWalletTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('invites') // 'invites' or 'wallet'
  
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!userProfile?.id) return

    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userProfile.id)
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data
        }
      })
      setInvites(list)
    }, (err) => {
      console.error("Error fetching referrals:", err)
    })

    return () => unsubscribe()
  }, [userProfile?.id])

  useEffect(() => {
    if (!userProfile?.id) return

    const q = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userProfile.id)
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setWalletTransactions(list)
    }, (err) => {
      console.error("Error fetching transactions:", err)
    })

    return () => unsubscribe()
  }, [userProfile?.id])

  const handleCopyCode = () => {
    if (!userProfile?.referralCode) return
    navigator.clipboard.writeText(userProfile.referralCode)
    setCopied(true)
    toast.success("Referral code copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const getWhatsAppLink = () => {
    if (!userProfile?.referralCode) return ''
    const text = `Hey! Sign up on KisaNetra using my referral code *${userProfile.referralCode}* to get an instant ₹100 discount on your first order! Shop fresh farm-direct products at: `
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://kisanetra.com'
    return `https://wa.me/?text=${encodeURIComponent(text + url)}`
  }

  const handleApplyCodeSubmit = async (e) => {
    e.preventDefault()
    if (!referralCodeInput.trim()) return
    setIsApplying(true)
    try {
      await applyReferralCode(referralCodeInput)
      setReferralCodeInput('')
      toast.success("Referral code applied successfully! ₹50 Welcome Bonus added to your wallet, and ₹100 discount is active for your first order (min order ₹300).")
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Failed to apply referral code")
    } finally {
      setIsApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-lg shadow-emerald-500/20" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 pb-20">
      {/* Background blobs for premium glassmorphism vibe */}
      <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-100/30 blur-[120px]" />
      <div className="absolute right-[-5%] top-[15%] h-[400px] w-[400px] rounded-full bg-teal-100/20 blur-[100px]" />
      
      <div className="max-w-4xl mx-auto space-y-8 py-12 px-4 relative z-10">
        
        {/* Premium Hero Banner */}
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl animate-in fade-in duration-700">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#022c22,#064e3b,#022c22)] opacity-95" />
          {/* Abstract shapes */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <Badge className="bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest">
                🤝 KisaNetra Community Rewards
              </Badge>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight italic">Refer & Earn Program</h1>
              <p className="text-sm md:text-base font-medium text-emerald-100/80 leading-relaxed">
                Grow the KisaNetra community. Invite your friends to shop fresh farm-direct harvest and unlock ₹100 cash rewards for each friend who places their first order!
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center h-24 w-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 shadow-inner">
              <Gift className="w-12 h-12 text-emerald-400 animate-bounce duration-1000" />
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Wallet Balance Card */}
          <Card className="border-none shadow-2xl shadow-emerald-900/5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-[32px] overflow-hidden md:col-span-1 flex flex-col justify-between p-8 relative min-h-[280px] hover:shadow-emerald-900/10 hover:scale-[1.01] transition-all duration-300 group">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Wallet className="w-36 h-36 -mr-8 -mt-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100/80">Wallet Balance</span>
              <div className="text-5xl font-black tracking-tight flex items-center gap-1 font-mono">
                ₹{userProfile?.walletBalance ?? 0}
              </div>
              <p className="text-xs text-emerald-100/90 font-medium leading-relaxed">Use this balance for purchases or withdraw to your bank account instantly.</p>
            </div>
            <div className="pt-6 relative z-10">
              <Button className="w-full bg-white hover:bg-emerald-50 text-emerald-800 rounded-full font-black h-12 border-none shadow-md shadow-emerald-950/20 active:scale-95 transition-transform">
                Withdraw Balance
              </Button>
            </div>
          </Card>

          {/* Share Referral Code Card */}
          <Card className="border-none shadow-xl shadow-slate-100 bg-white/80 backdrop-blur-md rounded-[32px] overflow-hidden md:col-span-2 p-8 flex flex-col justify-between min-h-[280px] border border-white hover:shadow-2xl transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Referral Code</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Give ₹100, Get ₹100</h3>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded-full px-3 py-1">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Dual Reward
                </Badge>
              </div>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                When your friend makes their first purchase and it's delivered, we'll add <strong className="text-emerald-700">₹100</strong> to your account and give them a <strong className="text-emerald-700">₹100 discount</strong> on their order!
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 mt-6">
              {/* Share/Copy Code */}
              <div className="bg-slate-50/80 border border-slate-100/50 rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Your Unique Code</span>
                  <div className="text-2xl font-black text-slate-800 tracking-widest font-mono mt-1 select-all bg-emerald-50/50 border border-emerald-100/30 rounded-xl px-3 py-1.5 inline-block">
                    {userProfile?.referralCode || 'GENERATING...'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm"
                    onClick={handleCopyCode}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl h-11 font-black text-xs shadow-sm hover:shadow active:scale-95 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <a 
                    href={getWhatsAppLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-none"
                  >
                    <Button 
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 w-11 p-0 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Apply Friend's Code */}
              <div className="bg-slate-50/80 border border-slate-100/50 rounded-2xl p-5 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Been Referred?</span>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">Enter your friend's code to unlock your first-order reward.</p>
                </div>

                {userProfile?.referredBy ? (
                  <div className="flex items-center gap-2.5 text-emerald-800 bg-emerald-100/50 border border-emerald-200/50 rounded-xl px-4 py-3 text-xs font-black mt-2">
                    <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
                    Code Applied: {userProfile.referredByCode || 'Friend Link'}
                  </div>
                ) : (
                  <form onSubmit={handleApplyCodeSubmit} className="flex gap-2 mt-2">
                    <Input 
                      placeholder="Enter code (e.g. KISA-...)" 
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value)}
                      className="h-11 rounded-xl bg-white border-slate-200 text-xs font-black font-mono uppercase focus-visible:ring-emerald-500 focus-visible:ring-offset-0 placeholder:text-slate-300"
                      disabled={isApplying}
                    />
                    <Button 
                      type="submit" 
                      disabled={isApplying || !referralCodeInput.trim()}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 text-xs font-black shrink-0 px-5 active:scale-95 transition-all shadow-sm"
                    >
                      Apply
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Invites Tracker & Wallet History Card */}
        <Card className="border-none shadow-xl shadow-slate-100 bg-white/80 backdrop-blur-md rounded-[32px] p-8 md:col-span-2 border border-white hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Activity & Logs</h3>
              <p className="text-xs font-medium text-slate-400">Monitor your invites and wallet balance transactions</p>
            </div>
            
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
              <button 
                onClick={() => setActiveTab('invites')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'invites' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Referred Friends ({invites.length})
              </button>
              <button 
                onClick={() => setActiveTab('wallet')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'wallet' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Wallet History ({walletTransactions.length})
              </button>
            </div>
          </div>
          
          <div className="mt-6 space-y-4 max-h-[340px] overflow-y-auto pr-1">
            {activeTab === 'invites' ? (
              invites.length === 0 ? (
                <div className="text-center py-14 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto border border-dashed border-slate-200">
                    <Users className="w-7 h-7" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No friends referred yet. Share your code above to get started!</p>
                </div>
              ) : (
                invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 hover:border-slate-100 transition-all duration-300">
                    <div className="space-y-1">
                      <div className="font-black text-slate-800 text-sm">{invite.refereeName}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                        Joined: {new Date(invite.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {invite.status === 'credited' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 text-xs font-black shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Credited +₹100
                        </span>
                      ) : invite.status === 'Delivered' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 text-xs font-black shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 px-3.5 py-1.5 text-xs font-black shadow-sm">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Registered
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              walletTransactions.length === 0 ? (
                <div className="text-center py-14 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto border border-dashed border-slate-200">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No wallet transactions recorded yet.</p>
                </div>
              ) : (
                walletTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 hover:border-slate-100 transition-all duration-300">
                    <div className="space-y-1">
                      <div className="font-black text-slate-800 text-sm">{tx.note}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                        Date: {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    
                    <span className={`font-mono font-black text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                    </span>
                  </div>
                ))
              )
            )}
          </div>
        </Card>

        {/* Guidelines */}
        <Card className="border-none shadow-xl shadow-slate-100 bg-white/80 backdrop-blur-md rounded-[32px] p-8 md:col-span-1 border border-white hover:shadow-2xl transition-all duration-300 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-slate-900 pb-3 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-black tracking-tight">Program Terms</h3>
            </div>
            
            <div className="space-y-5 text-xs font-bold text-slate-500 leading-relaxed">
              <div className="flex gap-3">
                <span className="h-6 w-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 text-[11px] font-black shrink-0 border border-emerald-100">1</span>
                <div className="space-y-1">
                  <span className="text-slate-800">English:</span> Share code. Friend gets ₹50 Welcome Bonus + ₹100 discount on 1st order of ₹300+.
                  <div className="text-[10px] text-slate-400 font-medium font-sans">Telugu: స్నేహితుడు ₹50 సైన్అప్ బోనస్ మరియు ₹300+ మొదటి ఆర్డర్‌పై ₹100 తగ్గింపు పొందుతారు.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="h-6 w-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 text-[11px] font-black shrink-0 border border-emerald-100">2</span>
                <div className="space-y-1">
                  <span className="text-slate-800">English:</span> You earn ₹100 wallet credit after successful delivery of their order.
                  <div className="text-[10px] text-slate-400 font-medium font-sans">Telugu: వారి ఆర్డర్ డెలివరీ విజయవంతం అయిన తర్వాత మీకు ₹100 లభిస్తుంది.</div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="h-6 w-6 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 text-[11px] font-black shrink-0 border border-emerald-100">3</span>
                <div className="space-y-1">
                  <span className="text-slate-800">English:</span> No self-referrals or duplicate account abuse allowed.
                  <div className="text-[10px] text-slate-400 font-medium font-sans">Telugu: సెల్ఫ్-రెఫరల్స్ లేదా ఒకే వ్యక్తి డూప్లికేట్ ఖాతాల వాడకం నిషిద్ధం.</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 text-[11px] font-black text-emerald-800 flex gap-2 items-start">
            <span className="text-base leading-none">💡</span>
            <span>Quick Tip: Share via WhatsApp to automatically include instructions!</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
