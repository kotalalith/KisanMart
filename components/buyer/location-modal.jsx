'use client'

import { useState, useEffect } from 'react'
import { MapPin, Navigation, Search, Check, AlertTriangle, Loader2, Home, Briefcase, Warehouse, Compass, RotateCcw, Clock } from 'lucide-react'
import { useLocation } from '@/lib/location-context'
import { useUser } from '@/lib/user-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function LocationModal({ isOpen, onClose }) {
  const { 
    fullLocationDetails, 
    setManualLocationDetail, 
    lookupPincode, 
    refreshLocation,
    isChecking,
    userLocation
  } = useLocation()
  
  const { addresses } = useUser()

  const [activeTab, setActiveTab] = useState('gps') // 'gps' | 'pincode' | 'search' | 'saved' | 'recent' | 'manual'
  const [gpsStep, setGpsStep] = useState('idle') // 'idle' | 'detecting' | 'geocoding' | 'success' | 'error'
  const [gpsError, setGpsError] = useState('')
  const [gpsDetail, setGpsDetail] = useState(null)

  // Pincode state
  const [pincodeQuery, setPincodeQuery] = useState('')
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')
  const [pincodeResult, setPincodeResult] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchPreviewCoord, setSearchPreviewCoord] = useState(null)

  // Recent locations state
  const [recentLocations, setRecentLocations] = useState([])

  // Manual state
  const [manualForm, setManualForm] = useState({
    village: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    lat: '',
    lng: ''
  })

  // Load recent locations from localStorage
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('agro_recent_locations')
      if (stored) {
        try {
          setRecentLocations(JSON.parse(stored))
        } catch (e) {
          setRecentLocations([])
        }
      }
    }
  }, [isOpen])

  // Save to recent locations helper
  const saveToRecentLocations = (detail) => {
    if (!detail || (!detail.city && !detail.village)) return
    const stored = localStorage.getItem('agro_recent_locations')
    let list = []
    if (stored) {
      try {
        list = JSON.parse(stored)
      } catch (e) {}
    }
    // Filter out duplicates based on village/city/pincode
    list = list.filter(item => 
      !(item.city === detail.city && item.village === detail.village && item.pincode === detail.pincode)
    )
    // Add to front of list
    list.unshift(detail)
    // Limit to 5 items
    list = list.slice(0, 5)
    localStorage.setItem('agro_recent_locations', JSON.stringify(list))
    setRecentLocations(list)
  }

  // Handle click on instant search suggestion
  const handleSelectSuggestion = (sug) => {
    const addr = sug.address || {}
    const village = addr.village || addr.suburb || addr.neighbourhood || addr.locality || addr.hamlet || addr.road || sug.display_name.split(',')[0] || 'Selected Area'
    const city = addr.city || addr.town || addr.municipality || addr.state_district || 'District Centre'
    const district = addr.state_district || addr.county || ''
    const state = addr.state || ''
    const pincode = addr.postcode || ''
    const lat = parseFloat(sug.lat)
    const lng = parseFloat(sug.lon)

    const detail = {
      village,
      city,
      district,
      state,
      pincode,
      lat,
      lng
    }

    setSearchPreviewCoord({ lat, lng })
    setManualLocationDetail(detail)
    saveToRecentLocations(detail)
    onClose()
  }

  // Fetch search suggestions debounced
  useEffect(() => {
    if (activeTab !== 'search' || searchQuery.trim().length < 3) {
      setSuggestions([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&addressdetails=1&limit=6`, {
          headers: {
            'Accept-Language': 'en'
          }
        })
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data || [])
          if (data && data.length > 0) {
            setSearchPreviewCoord({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
          }
        }
      } catch (e) {
        console.error("Nominatim search failed:", e)
      } finally {
        setSearchLoading(false)
      }
    }, 600)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, activeTab])

  // Set default manual form values from context on open
  useEffect(() => {
    if (isOpen && fullLocationDetails) {
      setManualForm({
        village: fullLocationDetails.village || '',
        city: fullLocationDetails.city || '',
        district: fullLocationDetails.district || '',
        state: fullLocationDetails.state || '',
        pincode: fullLocationDetails.pincode || '',
        lat: fullLocationDetails.lat ? String(fullLocationDetails.lat) : '',
        lng: fullLocationDetails.lng ? String(fullLocationDetails.lng) : ''
      })
    }
  }, [isOpen, fullLocationDetails])

  // GPS detection trigger
  const handleGPSDetect = () => {
    setGpsStep('detecting')
    setGpsError('')
    
    if (!navigator.geolocation) {
      setGpsStep('error')
      setGpsError('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGpsStep('geocoding')
        const { latitude, longitude } = position.coords
        try {
          // Fetch reverse geocoded details
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          if (!response.ok) throw new Error("API response not ok")
          const data = await response.json()
          
          const details = {
            village: data.locality || 'Green Fields',
            city: data.city || 'Local Area',
            district: data.localityInfo?.administrative?.find(a => a.order === 5)?.name || data.city || '',
            state: data.principalSubdivision || 'India',
            pincode: data.postcode || '',
            lat: latitude,
            lng: longitude
          }
          
          setGpsDetail(details)
          setGpsStep('success')
        } catch (e) {
          // Fallback reverse geocoding using OSM
          try {
            const osmResp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
            if (osmResp.ok) {
              const osmData = await osmResp.json()
              const addr = osmData.address
              const details = {
                village: addr.village || addr.suburb || addr.neighbourhood || addr.road || 'Farm Region',
                city: addr.city || addr.town || 'District Center',
                district: addr.state_district || '',
                state: addr.state || '',
                pincode: addr.postcode || '',
                lat: latitude,
                lng: longitude
              }
              setGpsDetail(details)
              setGpsStep('success')
              return
            }
          } catch (err) {}

          // Hard fallback coordinates
          const details = {
            village: 'Detected Location',
            city: data.city || 'India',
            district: '',
            state: data.principalSubdivision || '',
            pincode: data.postcode || '',
            lat: latitude,
            lng: longitude
          }
          setGpsDetail(details)
          setGpsStep('success')
        }
      },
      (error) => {
        setGpsStep('error')
        if (error.code === 1) {
          setGpsError('Location permission denied. Please allow location access in your browser or enter pincode manually.')
        } else {
          setGpsError('Could not retrieve GPS coordinates. Please select manual entry.')
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    )
  }

  // Pincode Lookup trigger
  const handlePincodeSearch = async () => {
    if (!/^\d{6}$/.test(pincodeQuery)) {
      setPincodeError('Please enter a valid 6-digit Indian Pincode')
      return
    }
    setPincodeLoading(true)
    setPincodeError('')
    setPincodeResult(null)
    setSelectedBranch('')

    try {
      const data = await lookupPincode(pincodeQuery)
      setPincodeResult(data)
      if (data.branches && data.branches.length > 0) {
        setSelectedBranch(data.branches[0])
      }
    } catch (e) {
      setPincodeError(e.message || 'Pincode not found')
    } finally {
      setPincodeLoading(false)
    }
  }

  // Auto-validate pincode when user has typed exactly 6 digits
  useEffect(() => {
    if (pincodeQuery.length === 6) {
      handlePincodeSearch()
    }
  }, [pincodeQuery])

  // Saved Address selection
  const handleSelectSavedAddress = (address) => {
    // Extract lat/lng if stored, or estimate based on typical city/state coordinates
    let lat = parseFloat(address.lat) || 18.5204
    let lng = parseFloat(address.lng) || 73.8567
    
    // Fallback coordinates based on state if missing
    if (!address.lat || !address.lng) {
      const st = address.state.toLowerCase()
      if (st.includes("telangana") || st.includes("andhra")) { lat = 17.3850; lng = 78.4867; }
      else if (st.includes("maharashtra")) { lat = 19.0760; lng = 72.8777; }
      else if (st.includes("delhi")) { lat = 28.6139; lng = 77.2090; }
    }

    const detail = {
      village: address.addressLine1 || address.street || '',
      city: address.city,
      district: address.city,
      state: address.state,
      pincode: address.pincode || address.zip,
      lat,
      lng
    }
    
    setManualLocationDetail(detail)
    saveToRecentLocations(detail)
    onClose()
  }

  // Manual Confirmation
  const handleManualConfirm = (e) => {
    e.preventDefault()
    const detail = {
      village: manualForm.village || 'Green Fields',
      city: manualForm.city || 'Pune',
      district: manualForm.district || manualForm.city || '',
      state: manualForm.state || 'Maharashtra',
      pincode: manualForm.pincode || '',
      lat: parseFloat(manualForm.lat) || 18.5204,
      lng: parseFloat(manualForm.lng) || 73.8567
    }
    setManualLocationDetail(detail)
    saveToRecentLocations(detail)
    onClose()
  }

  // Pincode Confirmation
  const handlePincodeConfirm = () => {
    if (!pincodeResult) return
    const detail = {
      village: selectedBranch || pincodeResult.village,
      city: pincodeResult.city,
      district: pincodeResult.district,
      state: pincodeResult.state,
      pincode: pincodeResult.pincode,
      lat: pincodeResult.lat,
      lng: pincodeResult.lng
    }
    setManualLocationDetail(detail)
    saveToRecentLocations(detail)
    onClose()
  }

  // GPS Confirmation
  const handleGpsConfirm = () => {
    if (!gpsDetail) return
    setManualLocationDetail(gpsDetail)
    saveToRecentLocations(gpsDetail)
    onClose()
  }

  const activeLat = activeTab === 'gps' && gpsDetail ? gpsDetail.lat : 
                    activeTab === 'pincode' && pincodeResult ? pincodeResult.lat :
                    activeTab === 'search' && searchPreviewCoord ? searchPreviewCoord.lat :
                    activeTab === 'manual' && manualForm.lat ? parseFloat(manualForm.lat) :
                    fullLocationDetails.lat || 18.5204

  const activeLng = activeTab === 'gps' && gpsDetail ? gpsDetail.lng : 
                    activeTab === 'pincode' && pincodeResult ? pincodeResult.lng :
                    activeTab === 'search' && searchPreviewCoord ? searchPreviewCoord.lng :
                    activeTab === 'manual' && manualForm.lng ? parseFloat(manualForm.lng) :
                    fullLocationDetails.lng || 73.8567

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh]">
        
        {/* Top Header Map Preview */}
        <div className="w-full bg-slate-100 relative h-[160px] shrink-0 border-b border-slate-200">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md rounded-xl p-2.5 border border-slate-200 text-xs space-y-1 shadow-lg max-w-[280px]">
            <p className="font-black text-emerald-600 uppercase tracking-widest text-[9px]">Location Preview</p>
            <p className="font-extrabold text-slate-900 truncate">{activeTab === 'gps' && gpsDetail ? gpsDetail.village : fullLocationDetails.village || 'Pune Area'}</p>
          </div>
          <button 
             onClick={onClose} 
             className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 w-8 h-8 flex items-center justify-center rounded-full shadow-lg border border-slate-200 transition-all font-bold"
          >
             ✕
          </button>

          {/* OSM Iframe Embed */}
          <iframe 
            title="Location Selection Map"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeLng - 0.015}%2C${activeLat - 0.015}%2C${activeLng + 0.015}%2C${activeLat + 0.015}&layer=mapnik&marker=${activeLat}%2C${activeLng}`}
            className="w-full h-full border-none pointer-events-none"
            loading="lazy"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col">
          <div className="shrink-0">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <MapPin className="text-emerald-600 h-6 w-6" />
              Select Delivery Location
            </h2>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">Configure your location for real-time delivery estimation</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-100 pb-2 gap-1 scrollbar-thin scrollbar-thumb-slate-200">
            {[
              { id: 'gps', label: 'GPS Location', icon: Navigation },
              { id: 'pincode', label: 'Pincode Lookup', icon: Search },
              { id: 'saved', label: 'Saved Addresses', icon: Home }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border-b-2 shrink-0",
                  activeTab === tab.id 
                    ? "border-emerald-600 bg-emerald-50/40 text-emerald-800" 
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 flex flex-col">
            
            {/* GPS PANEL */}
            {activeTab === 'gps' && (
              <div className="space-y-6 flex-1 flex flex-col justify-center py-4">
                {gpsStep === 'idle' && (
                  <div className="text-center space-y-4 py-8">
                    <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 animate-pulse">
                      <Navigation className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-800">GPS Location Detection</h4>
                      <p className="text-slate-400 text-sm max-w-sm mx-auto">Allow device location permission to pinpoint your delivery coordinates automatically.</p>
                    </div>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                      <Button 
                        onClick={handleGPSDetect} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 w-full animate-bounce"
                      >
                        <Navigation className="h-4 w-4" />
                        Use Current GPS Location
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleGPSDetect} 
                        className="text-slate-700 border-slate-200 font-bold h-11 rounded-xl w-full"
                      >
                        Detect Automatically
                      </Button>
                    </div>
                  </div>
                )}

                {(gpsStep === 'detecting' || gpsStep === 'geocoding') && (
                  <div className="text-center space-y-4 py-10">
                    <Loader2 className="mx-auto h-12 w-12 text-emerald-600 animate-spin" />
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-800">
                        {gpsStep === 'detecting' ? 'Requesting GPS coordinates...' : 'Reverse geocoding address...'}
                      </h4>
                      <p className="text-slate-400 text-sm">Please select Allow when prompted by your device.</p>
                    </div>
                  </div>
                )}

                {gpsStep === 'success' && gpsDetail && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-3">
                      <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Detected Address</h4>
                      <div className="flex gap-3 items-start">
                        <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-base">{gpsDetail.village}</p>
                          <p className="text-slate-600 text-sm font-semibold">{gpsDetail.city}, {gpsDetail.district}</p>
                          <p className="text-slate-500 text-xs font-medium">{gpsDetail.state} - {gpsDetail.pincode}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase mt-1">Coordinates: {gpsDetail.lat.toFixed(4)}, {gpsDetail.lng.toFixed(4)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleGpsConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl">
                        Confirm and Use Location
                      </Button>
                      <Button variant="outline" onClick={handleGPSDetect} className="h-12 rounded-xl text-slate-700 flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Refresh Location
                      </Button>
                    </div>
                  </div>
                )}

                {gpsStep === 'error' && (
                  <div className="text-center space-y-4 py-8">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-slate-800">Detection Failed</h4>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">{gpsError}</p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button onClick={handleGPSDetect} className="bg-slate-900 text-white hover:bg-slate-800 font-black px-6 h-11 rounded-xl">
                        Retry GPS Detect
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('pincode')} className="h-11 rounded-xl text-slate-700">
                        Use Pincode Instead
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PINCODE LOOKUP PANEL */}
            {activeTab === 'pincode' && (
              <div className="space-y-6 py-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="pincode-input" className="text-slate-500 font-bold text-xs uppercase mb-1">Enter Delivery Pincode</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input 
                        id="pincode-input"
                        placeholder="e.g. 522212" 
                        value={pincodeQuery} 
                        onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, '').slice(0,6))}
                        className="pl-12 h-12 text-base font-bold rounded-xl border-slate-200 focus:ring-emerald-500 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 w-full font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handlePincodeSearch()}
                      />
                    </div>
                    <Button 
                      onClick={handlePincodeSearch} 
                      className="bg-emerald-600 hover:bg-emerald-700 font-black h-12 px-6 rounded-xl text-white shrink-0 text-xs uppercase"
                      disabled={pincodeLoading}
                    >
                      {pincodeLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Validate'}
                    </Button>
                  </div>
                </div>

                {pincodeError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {pincodeError}
                  </div>
                )}

                {pincodeResult && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[10px] uppercase font-black tracking-wider text-slate-400">District</Label>
                          <p className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5">{pincodeResult.district}</p>
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-black tracking-wider text-slate-400">State</Label>
                          <p className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5">{pincodeResult.state}</p>
                        </div>
                      </div>

                      {pincodeResult.branches && pincodeResult.branches.length > 0 ? (
                        <div className="space-y-2">
                          <Label htmlFor="branch-select" className="text-[10px] uppercase font-black tracking-wider text-slate-400">Select Post Office / Village</Label>
                          <select 
                            id="branch-select"
                            value={selectedBranch} 
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {pincodeResult.branches.map((br, i) => (
                              <option key={i} value={br}>{br}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Area</Label>
                          <p className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5">{pincodeResult.village}</p>
                        </div>
                      )}
                    </div>

                    <Button onClick={handlePincodeConfirm} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl">
                      Confirm and Use Location
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* SEARCH PANEL */}
            {activeTab === 'search' && (
              <div className="space-y-4 py-2 flex-1 flex flex-col">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="Search by Village, City, Mandal, District or Pincode..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 font-bold rounded-xl border-slate-200 focus:ring-emerald-500 bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {searchLoading && (
                  <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    <span className="text-xs font-semibold">Searching locations...</span>
                  </div>
                )}

                {!searchLoading && suggestions.length > 0 && (
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm divide-y divide-slate-50 max-h-[260px] overflow-y-auto">
                    {suggestions.map((sug, idx) => {
                      const addr = sug.address || {}
                      const mainText = addr.village || addr.suburb || addr.neighbourhood || addr.city || addr.town || sug.display_name.split(',')[0]
                      const subText = sug.display_name.split(',').slice(1).join(',').trim()
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(sug)}
                          onMouseEnter={() => setSearchPreviewCoord({ lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) })}
                          className="w-full text-left px-4 py-3 hover:bg-emerald-50/25 flex gap-3 items-center group transition-colors animate-in fade-in duration-200"
                        >
                          <MapPin className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">{mainText}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate">{subText}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {!searchLoading && searchQuery.trim().length >= 3 && suggestions.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs font-semibold animate-fade-in">
                    No matching locations found in India. Try checking spelling or search with a pincode.
                  </div>
                )}

                {searchQuery.trim().length < 3 && (
                  <div className="text-slate-400 text-[11px] text-center py-6 font-semibold">
                    Type 3 or more characters to see live suggestions.
                  </div>
                )}
              </div>
            )}

            {/* RECENT LOCATIONS PANEL */}
            {activeTab === 'recent' && (
              <div className="space-y-4 py-2 flex-1 flex flex-col">
                {recentLocations.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">No recent locations</p>
                      <p className="text-slate-400 text-sm">Your previously selected delivery areas will be shown here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {recentLocations.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setManualLocationDetail(item)
                          saveToRecentLocations(item)
                          onClose()
                        }}
                        className="flex items-start justify-between border border-slate-100 rounded-xl p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all group"
                      >
                        <div className="flex gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-none truncate">{item.village || item.city}</p>
                            <p className="text-slate-500 font-semibold text-xs sm:text-sm mt-1">{item.city}, {item.state} {item.pincode ? `- ${item.pincode}` : ''}</p>
                          </div>
                        </div>
                        <div className="h-5 w-5 rounded-full border border-slate-200 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                          <div className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-emerald-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        localStorage.removeItem('agro_recent_locations')
                        setRecentLocations([])
                      }}
                      className="w-full text-slate-500 text-xs font-bold h-10 border-slate-200 mt-2"
                    >
                      Clear Recent Locations
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* SAVED ADDRESSES PANEL */}
            {activeTab === 'saved' && (
              <div className="space-y-4 py-2">
                {addresses.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto">
                      <Home className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">No saved addresses</p>
                      <p className="text-slate-400 text-sm">Please register addresses in your account settings.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className="flex items-start justify-between border border-slate-100 rounded-xl p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all group"
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors",
                            addr.label === 'Home' && "bg-blue-50 text-blue-600",
                            addr.label === 'Farm' && "bg-green-50 text-green-600",
                            addr.label === 'Office' && "bg-amber-50 text-amber-600"
                          )}>
                            {addr.label === 'Home' && <Home className="h-5 w-5" />}
                            {addr.label === 'Farm' && <Warehouse className="h-5 w-5" />}
                            {addr.label === 'Office' && <Briefcase className="h-5 w-5" />}
                            {addr.label !== 'Home' && addr.label !== 'Farm' && addr.label !== 'Office' && <MapPin className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-none">{addr.label}</span>
                              {addr.isDefault && <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Default</span>}
                            </div>
                            <p className="text-slate-500 font-semibold text-xs sm:text-sm mt-1">{addr.fullName} - {addr.phone}</p>
                            <p className="text-slate-400 font-medium text-xs truncate max-w-[280px] sm:max-w-[340px] mt-0.5">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                          </div>
                        </div>
                        <div className="h-5 w-5 rounded-full border border-slate-200 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                          <div className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-emerald-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MANUAL PANEL */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualConfirm} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="village" className="text-slate-500 font-bold text-xs uppercase">Village / Locality</Label>
                    <Input 
                      id="village"
                      value={manualForm.village} 
                      onChange={(e) => setManualForm({...manualForm, village: e.target.value})}
                      className="h-10 text-slate-900 font-semibold rounded-lg border-slate-200 text-xs sm:text-sm"
                      placeholder="e.g. Madhapur"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-slate-500 font-bold text-xs uppercase">City / Town</Label>
                    <Input 
                      id="city"
                      value={manualForm.city} 
                      onChange={(e) => setManualForm({...manualForm, city: e.target.value})}
                      className="h-10 text-slate-900 font-semibold rounded-lg border-slate-200 text-xs sm:text-sm"
                      placeholder="e.g. Hyderabad"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="district" className="text-slate-500 font-bold text-xs uppercase">District</Label>
                    <Input 
                      id="district"
                      value={manualForm.district} 
                      onChange={(e) => setManualForm({...manualForm, district: e.target.value})}
                      className="h-10 text-slate-900 font-semibold rounded-lg border-slate-200 text-xs sm:text-sm"
                      placeholder="e.g. Hyderabad"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-slate-500 font-bold text-xs uppercase">State</Label>
                    <Input 
                      id="state"
                      value={manualForm.state} 
                      onChange={(e) => setManualForm({...manualForm, state: e.target.value})}
                      className="h-10 text-slate-900 font-semibold rounded-lg border-slate-200 text-xs sm:text-sm"
                      placeholder="e.g. Telangana"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pincode" className="text-slate-500 font-bold text-xs uppercase">Pincode</Label>
                    <Input 
                      id="pincode"
                      value={manualForm.pincode} 
                      onChange={(e) => setManualForm({...manualForm, pincode: e.target.value.replace(/\D/g,'').slice(0,6)})}
                      className="h-10 text-slate-900 font-semibold rounded-lg border-slate-200 text-xs sm:text-sm"
                      placeholder="e.g. 500081"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Configure Mapping Coordinates (Optional)</Label>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black uppercase tracking-tight">Manual Override</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="lat" className="text-[10px] text-slate-400 font-bold">Latitude</Label>
                      <Input 
                        id="lat"
                        type="number"
                        step="any"
                        value={manualForm.lat} 
                        onChange={(e) => setManualForm({...manualForm, lat: e.target.value})}
                        className="h-9 font-mono font-bold text-slate-800 text-xs rounded-lg bg-white border-slate-200"
                        placeholder="e.g. 17.3850"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="lng" className="text-[10px] text-slate-400 font-bold">Longitude</Label>
                      <Input 
                        id="lng"
                        type="number"
                        step="any"
                        value={manualForm.lng} 
                        onChange={(e) => setManualForm({...manualForm, lng: e.target.value})}
                        className="h-9 font-mono font-bold text-slate-800 text-xs rounded-lg bg-white border-slate-200"
                        placeholder="e.g. 78.4867"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-xl">
                  Confirm Manual Location
                </Button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
