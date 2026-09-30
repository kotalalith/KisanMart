'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { db } from './firebase'
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { useRole } from './role-context'
import { usePathname } from 'next/navigation'

const LocationContext = createContext(undefined)

// Haversine formula to calculate distance
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371 
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function LocationProvider({ children }) {
  const [zones, setZones] = useState([])
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [isAllowed, setIsAllowed] = useState(null)
  const [isChecking, setIsChecking] = useState(true)
  const [detectedCity, setDetectedCity] = useState(null)
  const [manualCity, setManualCity] = useState(null)

  // Expanded details state
  const [fullLocationDetails, setFullLocationDetails] = useState({
    village: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    lat: null,
    lng: null
  })
  const [auditLogs, setAuditLogs] = useState([])

  // Sync Zones
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "zones"), (snapshot) => {
      const zoneList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setZones(zoneList)
      setLoading(prev => waitlist.length > 0 ? false : prev)
    })
    return () => unsubscribe()
  }, [waitlist])

  // Sync Waitlist
  useEffect(() => {
    const q = query(collection(db, "waitlist"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setWaitlist(list)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const checkLocation = useCallback((lat, lng) => {
    const allowedZone = zones.find(zone => {
      if (!zone.is_active) return false
      const distance = calculateDistance(lat, lng, zone.center_lat, zone.center_lng)
      return distance <= zone.radius_km
    })
    return allowedZone ? allowedZone.city_name : null
  }, [zones])

  // Audit log saver
  const writeAuditLog = useCallback(async (action, details) => {
    const logEntry = {
      action,
      details,
      timestamp: new Date().toISOString(),
      userId: typeof window !== 'undefined' ? (localStorage.getItem('agro_test_uid') || 'guest') : 'guest'
    }
    
    setAuditLogs(prev => [logEntry, ...prev.slice(0, 49)])

    try {
      await addDoc(collection(db, "location_audit_logs"), {
        ...logEntry,
        createdAt: serverTimestamp()
      })
    } catch (e) {
      console.warn("Could not write Firestore audit log:", e)
    }
  }, [])

  // Geocoding Helper
  const reverseGeocodeAddress = useCallback(async (lat, lng) => {
    // Attempt 1: OpenStreetMap Nominatim
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en'
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.address) {
          const addr = data.address
          const village = addr.village || addr.suburb || addr.neighbourhood || addr.locality || addr.hamlet || addr.road || 'Green Fields';
          const city = addr.city || addr.town || addr.municipality || addr.state_district || 'District Centre';
          const district = addr.state_district || addr.county || '';
          const state = addr.state || '';
          const pincode = addr.postcode || '';
          
          await writeAuditLog("REVERSE_GEOCODE_SUCCESS_NOMINATIM", { lat, lng, pincode, city })
          return { village, city, district, state, pincode, lat, lng }
        }
      }
    } catch (e) {
      console.warn("Nominatim geocoding failed, trying BigDataCloud...", e)
    }

    // Attempt 2: BigDataCloud
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
      if (response.ok) {
        const data = await response.json()
        const village = data.locality || '';
        const city = data.city || data.localityInfo?.administrative?.find(a => a.order === 6)?.name || '';
        const district = data.localityInfo?.administrative?.find(a => a.order === 5)?.name || '';
        const state = data.principalSubdivision || '';
        const pincode = data.postcode || '';

        await writeAuditLog("REVERSE_GEOCODE_SUCCESS_BIGDATACLOUD", { lat, lng, pincode, city })
        return { village, city, district, state, pincode, lat, lng }
      }
    } catch (e) {
      console.error("Geocoding failed on all sources:", e)
      await writeAuditLog("REVERSE_GEOCODE_FAILED", { lat, lng, error: e.message })
    }

    // Fallback Pune Default
    const fallback = {
      village: 'Hadapsar Farm',
      city: 'Pune',
      district: 'Pune District',
      state: 'Maharashtra',
      pincode: '411028',
      lat,
      lng
    }
    await writeAuditLog("REVERSE_GEOCODE_FALLBACK", { lat, lng })
    return fallback
  }, [writeAuditLog])

  // Pincode Lookup Helper
  const lookupPincode = useCallback(async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) {
      throw new Error("Invalid Indian Pincode. Must be exactly 6 digits.")
    }
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      if (response.ok) {
        const data = await response.json()
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
          const postOffices = data[0].PostOffice
          const mainOffice = postOffices[0]
          
          let lat = 18.5204
          let lng = 73.8567
          
          const stateLower = mainOffice.State.toLowerCase()
          if (stateLower.includes("telangana") || stateLower.includes("andhra")) { lat = 17.3850; lng = 78.4867; }
          else if (stateLower.includes("maharashtra")) { lat = 18.5204; lng = 73.8567; }
          else if (stateLower.includes("karnataka")) { lat = 12.9716; lng = 77.5946; }
          else if (stateLower.includes("kerala")) { lat = 9.9312; lng = 76.2673; }
          else if (stateLower.includes("tamil")) { lat = 13.0827; lng = 80.2707; }
          else if (stateLower.includes("delhi")) { lat = 28.6139; lng = 77.2090; }
          else if (stateLower.includes("punjab") || stateLower.includes("haryana")) { lat = 30.7333; lng = 76.7794; }
          else if (stateLower.includes("gujarat")) { lat = 23.0225; lng = 72.5714; }
          else if (stateLower.includes("uttar")) { lat = 26.8467; lng = 80.9462; }
          else if (stateLower.includes("west bengal")) { lat = 22.5726; lng = 88.3639; }

          const result = {
            village: mainOffice.Name,
            city: mainOffice.District,
            district: mainOffice.District,
            state: mainOffice.State,
            pincode: pincode,
            lat,
            lng,
            branches: postOffices.map(po => po.Name)
          }
          
          await writeAuditLog("PINCODE_LOOKUP_SUCCESS", { pincode, city: result.city, state: result.state })
          return result
        }
      }
    } catch (e) {
      console.error("Pincode lookup error:", e)
      await writeAuditLog("PINCODE_LOOKUP_FAILED", { pincode, error: e.message })
    }
    
    throw new Error("Pincode not found or API is currently unreachable")
  }, [writeAuditLog])

  // Load from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem('agro_location')
    const cachedDetail = localStorage.getItem('agro_location_detail')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (Date.now() - data.timestamp < 7200000) {
          setUserLocation({ lat: data.lat, lng: data.lng })
          setDetectedCity(data.city)
          setIsAllowed(data.allowed)
          setIsChecking(false)
          
          if (cachedDetail) {
            setFullLocationDetails(JSON.parse(cachedDetail))
          } else {
            setFullLocationDetails({
              village: 'Cached Area',
              city: data.city || 'Pune',
              district: '',
              state: '',
              pincode: '',
              lat: data.lat,
              lng: data.lng
            })
          }
        }
      } catch (e) {
        localStorage.removeItem('agro_location')
        localStorage.removeItem('agro_location_detail')
      }
    }
  }, [])

  // Recheck allowed status if user location loaded but allowed state not finalized
  useEffect(() => {
    if (userLocation && zones.length > 0 && isAllowed !== true) {
      const cityName = checkLocation(userLocation.lat, userLocation.lng)
      if (cityName) {
        setIsAllowed(true)
        setDetectedCity(cityName)
      }
    }
  }, [zones, userLocation, isAllowed, checkLocation])

  const isCheckingRef = useRef(false)

  const setManualLocation = useCallback((zone) => {
    const detail = {
      village: 'Zone Centre',
      city: zone.city_name,
      district: zone.city_name,
      state: 'Local Zone',
      pincode: '',
      lat: zone.center_lat,
      lng: zone.center_lng
    }

    setUserLocation({ lat: zone.center_lat, lng: zone.center_lng })
    setDetectedCity(zone.city_name)
    setIsAllowed(true)
    setIsChecking(false)
    setManualCity(zone.id)
    setFullLocationDetails(detail)
    
    localStorage.setItem('agro_location', JSON.stringify({
      lat: zone.center_lat, 
      lng: zone.center_lng, 
      city: zone.city_name, 
      allowed: true, 
      timestamp: Date.now(),
      manual: true,
      zoneId: zone.id
    }))

    localStorage.setItem('agro_location_detail', JSON.stringify(detail))
    writeAuditLog("MANUAL_ZONE_SELECT", { zoneId: zone.id, cityName: zone.city_name })
  }, [writeAuditLog])

  const setManualLocationDetail = useCallback((detail) => {
    setUserLocation({ lat: detail.lat, lng: detail.lng })
    setDetectedCity(detail.city)
    setIsAllowed(true) // Manual settings bypass standard city gating (allow customize)
    setIsChecking(false)
    setFullLocationDetails(detail)
    
    localStorage.setItem('agro_location', JSON.stringify({
      lat: detail.lat,
      lng: detail.lng,
      city: detail.city,
      allowed: true,
      timestamp: Date.now(),
      manual: true
    }))

    localStorage.setItem('agro_location_detail', JSON.stringify(detail))
    writeAuditLog("MANUAL_LOCATION_DETAIL_SET", detail)
  }, [writeAuditLog])

  const refreshLocation = useCallback(async () => {
    if (typeof window === 'undefined' || isCheckingRef.current) return
    
    isCheckingRef.current = true
    setIsChecking(true)

    const finalize = async (city, allowed, lat = null, lng = null) => {
      setDetectedCity(city)
      setIsAllowed(allowed)
      if (lat && lng) {
        setUserLocation({ lat, lng })
        const details = await reverseGeocodeAddress(lat, lng)
        setFullLocationDetails(details)
        localStorage.setItem('agro_location_detail', JSON.stringify(details))
      }
      setIsChecking(false)
      isCheckingRef.current = false
      
      localStorage.setItem('agro_location', JSON.stringify({
        lat, lng, city, allowed, timestamp: Date.now()
      }))
    }

    const fallbackIPLocation = async () => {
      const providers = [
        { url: 'https://ipapi.co/json/', lat: 'latitude', lng: 'longitude', city: 'city' },
        { url: 'https://ip-api.com/json', lat: 'lat', lng: 'lon', city: 'city' },
        { url: 'https://freeipapi.com/api/json', lat: 'latitude', lng: 'longitude', city: 'cityName' }
      ]

      for (const provider of providers) {
        try {
          const response = await fetch(provider.url)
          if (!response.ok) continue
          const data = await response.json()
          const lat = data[provider.lat]
          const lng = data[provider.lng]
          const cityName = checkLocation(lat, lng)
          await finalize(cityName || data[provider.city] || "Pune", !!cityName, lat, lng)
          await writeAuditLog("IP_GEOLOCATION_SUCCESS", { provider: provider.url, lat, lng })
          return
        } catch (e) {
          console.warn(`Provider ${provider.url} failed, trying next...`)
        }
      }
      // Ultimate fallback: Pune coordinates
      await finalize("Pune", true, 18.5204, 73.8567)
      await writeAuditLog("IP_GEOLOCATION_FAILED_FALLBACK_PUNE", {})
    }

    if (!navigator.geolocation) {
      await writeAuditLog("GEOLOCATION_API_NOT_SUPPORTED", {})
      await fallbackIPLocation()
      return
    }

    const timeoutId = setTimeout(() => {
      writeAuditLog("GEOLOCATION_TIMEOUT", {})
      fallbackIPLocation()
    }, 4500)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId)
        const { latitude, longitude } = position.coords
        const cityName = checkLocation(latitude, longitude)
        
        await writeAuditLog("GEOLOCATION_BROWSER_PERMITTED", { latitude, longitude })
        if (cityName) {
          await finalize(cityName, true, latitude, longitude)
        } else {
          try {
            const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            const data = await resp.json()
            await finalize(data.city || data.locality || "Pune", true, latitude, longitude)
          } catch (e) {
            await finalize("Pune", true, latitude, longitude)
          }
        }
      },
      async (error) => {
        clearTimeout(timeoutId)
        await writeAuditLog("GEOLOCATION_BROWSER_DENIED", { code: error.code, message: error.message })
        await fallbackIPLocation()
      },
      { timeout: 4000, enableHighAccuracy: true }
    )
  }, [checkLocation, reverseGeocodeAddress, writeAuditLog])

  const { role } = useRole()
  const pathname = usePathname()

  // Auto-trigger only once on mount
  useEffect(() => {
    const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/seller')
    
    if (isExcludedPath) {
      setIsChecking(false)
      setIsAllowed(true)
      return
    }

    if (role === 'buyer' && isAllowed === null && !isCheckingRef.current) {
      const cached = localStorage.getItem('agro_location')
      if (!cached) {
        refreshLocation()
      } else {
        const data = JSON.parse(cached)
        if (Date.now() - data.timestamp > 7200000) {
          refreshLocation()
        }
      }
    }
  }, [role, pathname, isAllowed, refreshLocation])

  const addToWaitlist = async (entry) => {
    try {
      await addDoc(collection(db, "waitlist"), {
        ...entry,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        createdAt: serverTimestamp()
      })
      await writeAuditLog("WAITLIST_JOIN", { name: entry.name, city: entry.city_detected })
    } catch (error) {
      console.error("Waitlist error:", error)
    }
  }

  const toggleZone = async (id) => {
    try {
      const zone = zones.find(z => z.id === id)
      await updateDoc(doc(db, "zones", id), {
        is_active: !zone.is_active
      })
    } catch (error) {
      console.error("Toggle zone error:", error)
    }
  }

  const addZone = async (newZone) => {
    try {
      await addDoc(collection(db, "zones"), {
        ...newZone,
        createdAt: serverTimestamp()
      })
    } catch (error) {
      console.error("Add zone error:", error)
    }
  }

  const updateZone = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, "zones", id), {
        ...updatedData,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error("Update zone error:", error)
    }
  }

  const value = useMemo(() => ({
    zones,
    waitlist,
    loading,
    userLocation,
    isAllowed,
    isChecking,
    detectedCity,
    fullLocationDetails,
    auditLogs,
    addToWaitlist,
    toggleZone,
    addZone,
    updateZone,
    refreshLocation,
    setManualLocation,
    setManualLocationDetail,
    lookupPincode,
    reverseGeocodeAddress,
    writeAuditLog
  }), [zones, waitlist, loading, userLocation, isAllowed, isChecking, detectedCity, fullLocationDetails, auditLogs, refreshLocation, setManualLocation, setManualLocationDetail, lookupPincode, reverseGeocodeAddress, writeAuditLog])

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) throw new Error('useLocation must be used within a LocationProvider')
  return context
}
