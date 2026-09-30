'use client'

import { useState } from 'react'
import { useLocation } from '@/lib/location-context'
import { 
  MapPin, 
  Plus, 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminLocationPage() {
  const { zones, waitlist, toggleZone, addZone, updateZone } = useLocation()
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(null) // Stores the zone being edited
  const [newCity, setNewCity] = useState({ city_name: '', center_lat: '', center_lng: '', radius_km: 15 })
  const [editCity, setEditCity] = useState({ city_name: '', center_lat: '', center_lng: '', radius_km: 15 })

  const handleAddZone = (e) => {
    e.preventDefault()
    addZone({
      ...newCity,
      center_lat: parseFloat(newCity.center_lat),
      center_lng: parseFloat(newCity.center_lng),
      radius_km: parseFloat(newCity.radius_km),
      is_active: true
    })
    setNewCity({ city_name: '', center_lat: '', center_lng: '', radius_km: 15 })
    setIsAdding(false)
  }

  const [filterCity, setFilterCity] = useState("all")

  const handleUpdateZone = (e) => {
    e.preventDefault()
    updateZone(isEditing.id, {
      ...editCity,
      center_lat: parseFloat(editCity.center_lat),
      center_lng: parseFloat(editCity.center_lng),
      radius_km: parseFloat(editCity.radius_km)
    })
    setIsEditing(null)
  }

  const startEditing = (zone) => {
    setIsEditing(zone)
    setEditCity({
      city_name: zone.city_name,
      center_lat: zone.center_lat.toString(),
      center_lng: zone.center_lng.toString(),
      radius_km: zone.radius_km.toString()
    })
  }

  // Count waitlist by city
  const waitlistStats = waitlist.reduce((acc, user) => {
    const city = user.city_detected || 'Unknown'
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">Define and manage serviceable geographic zones</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add New Zone
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.filter(z => z.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Serving {zones.filter(z => z.is_active).length} cities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlist Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitlist.length}</div>
            <p className="text-xs text-muted-foreground">Potential customers in queue</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Demand City</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Object.keys(waitlistStats).length > 0 
                ? Object.entries(waitlistStats).sort((a,b) => b[1] - a[1])[0][0] 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(waitlistStats).length > 0 
                ? `${Object.entries(waitlistStats).sort((a,b) => b[1] - a[1])[0][1]} users waiting`
                : 'Highest signup cluster'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Demand Leaderboard */}
      <Card className="border-none bg-secondary/30">
        <CardHeader>
          <CardTitle className="text-lg">Demand Leaderboard</CardTitle>
          <CardDescription>Top cities requesting AgroBridge service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(waitlistStats).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([city, count], index) => (
              <div key={city} className="flex items-center gap-3 bg-card p-3 rounded-xl border shadow-sm min-w-[180px]">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  #{index + 1}
                </div>
                <div>
                  <p className="text-sm font-bold capitalize">{city}</p>
                  <p className="text-xs text-muted-foreground">{count} Users</p>
                </div>
              </div>
            ))}
            {Object.keys(waitlistStats).length === 0 && (
              <p className="text-sm text-muted-foreground italic">No demand data available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Zones List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Serviceable Zones</CardTitle>
            <CardDescription>Cities where AgroBridge is currently active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${zone.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <div>
                      <p className="font-bold">{zone.city_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {zone.center_lat}, {zone.center_lng} • {zone.radius_km}km radius
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => startEditing(zone)}
                      title="Edit Location"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleZone(zone.id)}
                      title={zone.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {zone.is_active ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Demand & Waitlist</CardTitle>
                <CardDescription>Users waiting for service in their city</CardDescription>
              </div>
              <select 
                className="text-xs border rounded-md p-1 bg-background"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              >
                <option value="all">All Cities</option>
                {Object.keys(waitlistStats).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>City/Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlist.filter(u => filterCity === "all" || u.city === filterCity || u.city_detected === filterCity).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No users found for this city
                    </TableCell>
                  </TableRow>
                ) : (
                  waitlist
                    .filter(u => filterCity === "all" || u.city === filterCity || u.city_detected === filterCity)
                    .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.city || user.city_detected || 'Unknown Area'}</span>
                          <span className="text-[10px] text-muted-foreground">{user.lat?.toFixed(4)}, {user.lng?.toFixed(4)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'Just now'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]">
                          Approve City
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Zone Dialog */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl border-2">
            <CardHeader>
              <CardTitle>Add Service Zone</CardTitle>
              <CardDescription>Define a new city and service radius</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddZone} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">City Name</label>
                    <Input 
                      placeholder="e.g. Tenali" 
                      required 
                      value={newCity.city_name}
                      onChange={(e) => setNewCity({...newCity, city_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Latitude</label>
                    <Input 
                      placeholder="16.2437" 
                      type="number" 
                      step="0.0001" 
                      required 
                      value={newCity.center_lat}
                      onChange={(e) => setNewCity({...newCity, center_lat: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Longitude</label>
                    <Input 
                      placeholder="80.6406" 
                      type="number" 
                      step="0.0001" 
                      required 
                      value={newCity.center_lng}
                      onChange={(e) => setNewCity({...newCity, center_lng: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Radius (km)</label>
                    <Input 
                      type="number" 
                      required 
                      value={newCity.radius_km}
                      onChange={(e) => setNewCity({...newCity, radius_km: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button type="submit">Create Zone</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Zone Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Edit Service Zone</CardTitle>
              <CardDescription>Update details for {isEditing.city_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateZone} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">City Name</label>
                    <Input 
                      placeholder="e.g. Tenali" 
                      required 
                      value={editCity.city_name}
                      onChange={(e) => setEditCity({...editCity, city_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Latitude</label>
                    <Input 
                      placeholder="16.2437" 
                      type="number" 
                      step="0.0001" 
                      required 
                      value={editCity.center_lat}
                      onChange={(e) => setEditCity({...editCity, center_lat: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Longitude</label>
                    <Input 
                      placeholder="80.6406" 
                      type="number" 
                      step="0.0001" 
                      required 
                      value={editCity.center_lng}
                      onChange={(e) => setEditCity({...editCity, center_lng: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Radius (km)</label>
                    <Input 
                      type="number" 
                      required 
                      value={editCity.radius_km}
                      onChange={(e) => setEditCity({...editCity, radius_km: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(null)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
