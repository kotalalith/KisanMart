'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, User, MapPin, Menu, Loader2, Heart, X, TrendingUp, History, ChevronRight, Leaf, Apple, Wheat, Package, RefreshCw, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useCart } from '@/lib/cart-context'
import { useProducts } from '@/lib/product-context'
import { useLocation } from '@/lib/location-context'
import { useUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'
import { LocationModal } from '@/components/buyer/location-modal'
import { NotificationCenterDrawer } from '@/components/notification-center-drawer'
import { AnnouncementBanner } from '@/components/announcements/announcement-banner'
import { AnnouncementPopup } from '@/components/announcements/announcement-popup'

export function BuyerHeader() {
  const { itemCount } = useCart()
  const { products } = useProducts()
  const { isChecking, isAllowed, detectedCity, fullLocationDetails } = useLocation()
  const { userProfile } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const profileRef = useRef(null)

  const trendingSearches = [
    "Organic Tomatoes", "Fresh Grains", "Seasonal Fruits", "Pesticide Free"
  ]

  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.search-container-class')) {
        setIsSearchFocused(false)
        setActiveIndex(-1)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    const handleScroll = () => {
      setIsSticky(window.scrollY > 10)
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("scroll", handleScroll, { passive: true })
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const filteredProducts = searchQuery
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const list = searchQuery ? filteredProducts : trendingSearches
      setActiveIndex(prev => (prev < list.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      if (searchQuery && activeIndex >= 0 && filteredProducts[activeIndex]) {
        router.push(`/product/${filteredProducts[activeIndex].id}`)
        closeSearch()
      } else if (!searchQuery && activeIndex >= 0) {
        setSearchQuery(trendingSearches[activeIndex])
        setActiveIndex(-1)
      } else if (searchQuery) {
        router.push(`/categories?q=${searchQuery}`)
        closeSearch()
      }
    } else if (e.key === 'Escape') {
      closeSearch()
    }
  }

  const closeSearch = () => {
    setIsSearchFocused(false)
    setSearchQuery('')
    setActiveIndex(-1)
  }

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || ""
    if (cat.includes("veg")) return <Leaf className="h-4 w-4" />
    if (cat.includes("fruit")) return <Apple className="h-4 w-4" />
    if (cat.includes("grain")) return <Wheat className="h-4 w-4" />
    return <Package className="h-4 w-4" />
  }

  // Profile Menu layout content
  const renderProfileContent = (closeCallback) => (
    <div className="relative px-2 py-3 space-y-0.5">
      <button onClick={() => { router.push('/profile'); closeCallback(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white group-hover:shadow-sm"><User className="h-4 w-4" /></div> My Profile
      </button>

      <button onClick={() => { router.push('/orders'); closeCallback(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white group-hover:shadow-sm"><Package className="h-4 w-4" /></div> My Orders
      </button>

      <button onClick={() => { router.push('/coming-soon'); closeCallback(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white group-hover:shadow-sm"><History className="h-4 w-4" /></div> Payments
      </button>

      <button onClick={() => { router.push('/addresses'); closeCallback(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white group-hover:shadow-sm"><MapPin className="h-4 w-4" /></div> Manage Address
      </button>

      <button onClick={() => { router.push('/coming-soon'); closeCallback(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white group-hover:shadow-sm"><Menu className="h-4 w-4" /></div> Settings
      </button>

      <button onClick={() => { router.push('/refer-earn'); closeCallback(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white group-hover:shadow-sm"><Gift className="h-4 w-4" /></div> Refer & Earn
      </button>

      <div className="h-px bg-emerald-50 mx-3 my-2" />

      <button onClick={() => { router.push('/seller'); closeCallback(); }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all group">
        <span className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><RefreshCw className="h-4 w-4" /></div> Login as Seller
        </span>
        <ChevronRight className="h-4 w-4" />
      </button>

      <button onClick={() => { router.push('/support'); closeCallback(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-white group-hover:shadow-sm">🎧</div> Customer Care
      </button>

      <button 
        onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center">🚪</div> Logout
      </button>
    </div>
  )

  const renderSearchField = (isMobileView) => (
    <div className={cn(
      "relative flex-1 flex items-center transition-all duration-300 search-container-class",
      isSearchFocused ? "scale-[1.01]" : "scale-100"
    )}>
      <div className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300",
        isSearchFocused ? "text-emerald-600" : "text-slate-400"
      )}>
        <Search className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <Input
        placeholder="Search vegetables, fruits, grains..."
        className={cn(
          "pl-10 pr-10 h-10 bg-slate-50 border-none rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ring-0 focus-visible:ring-2 focus-visible:ring-emerald-500/20 placeholder:text-slate-400 w-full",
          isSearchFocused ? "bg-white shadow-[0_0_0_1px_#10b981,0_4px_20px_rgba(0,0,0,0.05)]" : "hover:bg-slate-100"
        )}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setActiveIndex(-1)
        }}
        onFocus={() => setIsSearchFocused(true)}
        onKeyDown={handleKeyDown}
      />
      {searchQuery && (
        <button 
          onClick={closeSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Suggestions Dropdown */}
      {isSearchFocused && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl border border-emerald-100 bg-white shadow-[0_20px_50px_rgba(16,185,129,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {!searchQuery ? (
            <div className="p-3">
              <div className="px-3 py-2 text-[10px] font-black text-emerald-800/40 uppercase tracking-widest border-b border-emerald-50 mb-2">Trending Searches</div>
              <div className="grid grid-cols-1 gap-0.5">
                {trendingSearches.map((search, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchQuery(search)
                      setActiveIndex(-1)
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all group",
                      activeIndex === idx ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <TrendingUp className={cn("h-4 w-4", activeIndex === idx ? "text-emerald-500" : "text-slate-300")} />
                    <span className="text-xs sm:text-sm font-semibold">{search}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="px-4 py-2.5 text-[10px] font-black text-emerald-800/40 uppercase tracking-widest border-b border-emerald-50 bg-slate-50/50 flex justify-between items-center">
                <span>Products</span>
                <span>{filteredProducts.length} Results</span>
              </div>
              {filteredProducts.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto p-1.5">
                  {filteredProducts.map((product, idx) => (
                    <div 
                      key={product.id}
                      onClick={() => {
                        router.push(`/product/${product.id}`)
                        closeSearch()
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                        activeIndex === idx ? "bg-emerald-50" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-transform",
                        activeIndex === idx ? "bg-white scale-105 shadow-sm text-emerald-600" : "bg-emerald-50 text-emerald-500/60"
                      )}>
                        {getCategoryIcon(product.categoryName)}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={cn(
                          "text-xs sm:text-sm font-bold truncate",
                          activeIndex === idx ? "text-emerald-900" : "text-slate-800"
                        )}>{product.name}</span>
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">{product.categoryName}</span>
                      </div>
                      {activeIndex === idx && <ChevronRight className="h-4 w-4 text-emerald-400 animate-in slide-in-from-left-2" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-400">No products found</p>
                  <Button variant="link" className="text-xs text-emerald-600 font-bold" onClick={() => router.push('/categories')}>Browse all categories</Button>
                </div>
              )}
              {filteredProducts.length > 0 && (
                 <div 
                  className="p-3 border-t border-emerald-50 bg-emerald-50/20 text-center cursor-pointer hover:bg-emerald-50 transition-colors"
                  onClick={() => router.push(`/categories?q=${searchQuery}`)}
                 >
                   <span className="text-[10px] sm:text-xs font-black text-emerald-700 uppercase tracking-widest">See all results</span>
                 </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderDeliveryLocationBar = () => {
    const cityName = detectedCity || 'Chebrolu'
    const pincode = fullLocationDetails?.pincode || '522212'
    const locationStr = isSticky 
      ? `${cityName} ${pincode}` 
      : `Delivering to ${cityName} ${pincode}`

    const statusIndicator = isSticky
      ? (isAllowed === false ? "🔴 Unavailable" : isAllowed === true ? "🟢 Available" : "🟡 Checking")
      : (isAllowed === false ? "🔴 Delivery Not Available" : isAllowed === true ? "🟢 Delivery Available" : "🟡 Checking Availability")

    const btnText = isSticky ? "Change" : "Change Location"

    return (
      <div className={cn(
        "w-full transition-all duration-300 border-t border-emerald-50 bg-white flex items-center justify-between mx-auto overflow-hidden",
        isSticky ? "h-11 shadow-sm" : "h-14 sm:h-16"
      )}>
        <div className="flex items-center gap-3 w-full max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className={cn(
              "font-bold text-slate-700 truncate transition-all flex items-center gap-1.5",
              isSticky ? "text-xs" : "text-xs sm:text-sm"
            )}>
              <span className="text-base shrink-0">📍</span>
              {isChecking ? (
                <span className="flex items-center gap-1 font-bold text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Detecting...
                </span>
              ) : (
                <span className="font-extrabold">{locationStr}</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className={cn(
              "font-bold transition-all text-xs",
              isAllowed === false ? "text-red-600" : isAllowed === true ? "text-emerald-600" : "text-amber-500"
            )}>
              {statusIndicator}
            </span>
            
            <Button 
              onClick={() => setIsLocationModalOpen(true)}
              variant="outline" 
              className={cn(
                "font-black tracking-widest uppercase text-emerald-700 border-emerald-200 bg-white hover:bg-emerald-50 transition-all shadow-sm shrink-0",
                isSticky ? "h-7 text-[9px] px-3 rounded-lg" : "h-9 text-[10px] px-4 rounded-xl"
              )}
            >
              {btnText}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const sidebarSheet = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-50 transition-colors">
          <Menu className="h-5 w-5 text-emerald-700" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] border-r-emerald-50 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col h-full bg-white">
          <div className="p-6 border-b border-emerald-50">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/20">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span className="font-bold text-emerald-950">AgroBridge</span>
            </Link>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">Home</Link>
            <Link href="/categories" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">Products</Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">About Us</Link>
            <Link href="/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">My Orders</Link>
          </nav>
          <div className="mt-auto p-4 border-t border-emerald-50">
            <div className="p-4 rounded-2xl bg-emerald-50/50">
              <p className="text-xs font-bold text-emerald-800 mb-1">Need help?</p>
              <p className="text-[11px] text-emerald-600/80 leading-relaxed mb-3">Our customer support is available 24/7 for you.</p>
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[11px] h-8">Contact Us</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/85 backdrop-blur-md transition-all duration-300">
      
      {/* 1. Mobile Header Layout (Viewport < 768px) */}
      <div className="flex md:hidden flex-col gap-2.5 px-3 py-3 w-full">
        {/* Row 1: Menu, Logo, Icons */}
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            {sidebarSheet}
            <Link href="/" className="flex items-center gap-1.5 shrink-0 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-md shadow-emerald-600/10 group-hover:scale-105 transition-transform">
                <span className="text-xs font-black text-white">A</span>
              </div>
              <span className="font-black text-emerald-950 tracking-tight text-sm min-[375px]:text-base">AgroBridge</span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <NotificationCenterDrawer />
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-slate-400">
                <Heart className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all text-slate-400">
                <ShoppingCart className="h-4.5 w-4.5" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-0.5 -top-0.5 h-4.5 w-4.5 rounded-full p-0 text-[9px] font-black flex items-center justify-center bg-emerald-600 border-2 border-white">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Profile Bottom Sheet (App-Like sheet popup) */}
            <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
              <SheetTrigger asChild>
                <button className="h-9 w-9 flex items-center justify-center rounded-xl border bg-white border-emerald-100/50 hover:bg-emerald-50 text-emerald-700 cursor-pointer transition-all outline-none">
                  <User className="h-4.5 w-4.5" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[2rem] p-0 overflow-hidden border-t-emerald-50 shadow-2xl bg-white max-h-[85vh]">
                <SheetTitle className="sr-only">Profile Settings</SheetTitle>
                <div className="relative px-6 py-4 border-b border-emerald-50 bg-slate-50/50">
                  <p className="text-base font-black text-emerald-950">{userProfile?.name || 'Guest User'}</p>
                  <p className="text-xs font-bold text-emerald-600/70">{userProfile?.phone || 'AgroBridge Account'}</p>
                </div>
                <div className="py-2">
                  {renderProfileContent(() => setIsProfileSheetOpen(false))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Row 2: Search Input */}
        <div className="flex items-center gap-2 w-full">
          {renderSearchField(true)}
        </div>
      </div>

      {/* 2. Desktop Header Layout (Viewport >= 768px) */}
      <div className="hidden md:flex mx-auto h-16 max-w-7xl items-center gap-4 px-4 md:px-6 w-full">
        {/* Mobile menu trigger hidden but here for structure */}
        <div className="hidden">{sidebarSheet}</div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <span className="text-base font-black text-white">A</span>
          </div>
          <span className="hidden font-black text-emerald-950 tracking-tight lg:inline-block text-xl">AgroBridge</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex ml-4">
          <Link href="/" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">Home</Link>
          <Link href="/categories" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">Products</Link>
          <Link href="/about" className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">About</Link>
        </nav>

        {/* Search */}
        <div className="flex flex-1 items-center gap-2 md:max-w-md lg:max-w-lg mx-auto relative" ref={searchRef}>
          {renderSearchField(false)}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">

          <div className="flex items-center gap-1 md:gap-2">
            <NotificationCenterDrawer />
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-slate-400">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all text-slate-400">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] font-black flex items-center justify-center bg-emerald-600 border-2 border-white">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Desktop User Profile Menu dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20",
                  isProfileOpen ? "bg-emerald-600 border-emerald-600 text-white shadow-lg" : "bg-white hover:bg-emerald-50 border-emerald-100/50 text-emerald-700"
                )}
              >
                <User className="h-5 w-5" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-72 rounded-2xl border border-emerald-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[9999] overflow-hidden py-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-white border-t border-l border-emerald-100 rotate-45" />
                  <div className="relative px-4 py-3 mb-2 border-b border-emerald-50 bg-slate-50/30">
                    <p className="text-sm font-black text-emerald-950 truncate">{userProfile?.name || 'Guest User'}</p>
                    <p className="text-[11px] font-bold text-emerald-600/60">{userProfile?.phone || 'AgroBridge Account'}</p>
                  </div>
                  {renderProfileContent(() => setIsProfileOpen(false))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      {renderDeliveryLocationBar()}
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </header>
    <div className="max-w-7xl mx-auto px-4 md:px-6 mt-3">
      <AnnouncementBanner role="buyer" />
    </div>
    <AnnouncementPopup role="buyer" />
    </>
  )
}
