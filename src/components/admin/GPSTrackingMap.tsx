'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  RefreshCw,
  MapPin,
  Wifi,
  WifiOff,
  Satellite,
  Map as MapIcon,
  Loader2,
  Truck,
  Filter,
  X,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GPSUnit {
  id: number
  unitNumber: string
  trailerType: string
  status: string
  skybitzDeviceId: string | null
  latitude: number | null
  longitude: number | null
  rentedTo: string | null
  updatedAt: string
}

interface SkyBitzStatus {
  configured: boolean
  provider: string
  authMode: string
}

const STATUS_COLORS: Record<string, string> = {
  available: '#059669',
  rented: '#2563eb',
  damaged: '#dc2626',
  for_sale: '#7c3aed',
  maintenance: '#d97706',
}

const STATUS_BG: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  rented: 'bg-blue-100 text-blue-800',
  damaged: 'bg-red-100 text-red-800',
  for_sale: 'bg-purple-100 text-purple-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
}

const TRAILER_LABELS: Record<string, string> = {
  sand_chassis: 'Sand Chassis',
  belly_dump: 'Belly Dump',
  sand_hopper: 'Sand Hopper',
  dry_van: 'Dry Van',
  flatbed: 'Flat Bed',
  tank: 'Tank',
}

function statusLabel(s: string): string {
  return (s ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GPSTrackingMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [units, setUnits] = useState<GPSUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [skybitzStatus, setSkybitzStatus] = useState<SkyBitzStatus | null>(
    null
  )
  const [mapStyle, setMapStyle] = useState<'light' | 'satellite'>('light')
  const [selectedUnit, setSelectedUnit] = useState<GPSUnit | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')

  // ------ Fetch positions from DB ------
  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gps/positions')
      const json = await res.json()
      if (json.success) setUnits(json.data)
    } catch {
      /* silently fail, data stays stale */
    }
  }, [])

  // ------ Check SkyBitz connection ------
  const checkSkyBitz = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gps/skybitz')
      const json = await res.json()
      if (json.success) setSkybitzStatus(json)
    } catch {
      /* ignore */
    }
  }, [])

  // ------ Refresh from SkyBitz ------
  const refreshFromSkyBitz = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetch('/api/admin/gps/skybitz', { method: 'POST' })
      await fetchPositions()
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false)
    }
  }, [fetchPositions])

  // ------ Initial load ------
  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([fetchPositions(), checkSkyBitz()])
      setLoading(false)
    }
    init()
  }, [fetchPositions, checkSkyBitz])

  // ------ Initialize map ------
  useEffect(() => {
    if (!mapContainer.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    const styleUrl =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11'

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [-99.5, 30.0], // Texas centered
      zoom: 5.5,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [mapStyle])

  // ------ Derived data ------
  const allGpsUnits = units.filter(
    (u) => u.latitude !== null && u.longitude !== null
  )
  const trackedCount = units.filter((u) => u.skybitzDeviceId !== null).length

  const filteredUnits = allGpsUnits.filter((u) => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    if (typeFilter !== 'all' && u.trailerType !== typeFilter) return false
    if (customerFilter !== 'all') {
      if (customerFilter === '__available__') {
        if (u.rentedTo) return false
      } else if (u.rentedTo !== customerFilter) {
        return false
      }
    }
    return true
  })

  const uniqueStatuses = [...new Set(allGpsUnits.map((u) => u.status))].sort()
  const uniqueTypes = [...new Set(allGpsUnits.map((u) => u.trailerType))].sort()
  const uniqueCustomers = [
    ...new Set(allGpsUnits.filter((u) => u.rentedTo).map((u) => u.rentedTo!)),
  ].sort()

  const hasActiveFilters =
    statusFilter !== 'all' || typeFilter !== 'all' || customerFilter !== 'all'

  // ------ Update markers when filtered units change ------
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds = new mapboxgl.LngLatBounds()
    let hasPoints = false

    for (const unit of filteredUnits) {
      if (unit.latitude === null || unit.longitude === null) continue

      const markerColor = STATUS_COLORS[unit.status] ?? '#6b7280'

      const el = document.createElement('div')
      el.style.cssText =
        'position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;'
      el.innerHTML = `
        <div style="background:${markerColor};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);line-height:1.3;">
          ${unit.unitNumber}
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid ${markerColor};"></div>
        <div style="width:8px;height:8px;background:${markerColor};border-radius:50%;border:2px solid white;margin-top:-2px;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>
      `

      el.addEventListener('click', () => setSelectedUnit(unit))

      const popup = new mapboxgl.Popup({ offset: 30, closeButton: true })
        .setHTML(`
        <div style="font-family:system-ui;min-width:180px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#111;">${unit.unitNumber}</div>
          <div style="font-size:12px;color:#555;margin-bottom:6px;">${TRAILER_LABELS[unit.trailerType] ?? unit.trailerType}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${markerColor};"></span>
            <span style="font-size:12px;font-weight:500;">${statusLabel(unit.status)}</span>
          </div>
          ${unit.rentedTo ? `<div style="font-size:11px;color:#666;">Rented to: <strong>${unit.rentedTo}</strong></div>` : ''}
          <div style="font-size:10px;color:#999;margin-top:6px;">
            ${unit.latitude?.toFixed(4)}, ${unit.longitude?.toFixed(4)}
          </div>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([unit.longitude, unit.latitude])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([unit.longitude, unit.latitude])
      hasPoints = true
    }

    if (hasPoints) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 10 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUnits.length, statusFilter, typeFilter, customerFilter, units])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Truck className="h-4 w-4" />
            Total Units
          </div>
          <div className="text-2xl font-bold text-gray-900">{units.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MapPin className="h-4 w-4" />
            GPS Located
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {allGpsUnits.length}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Satellite className="h-4 w-4" />
            SkyBitz Devices
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {trackedCount}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            {skybitzStatus?.configured ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
            SkyBitz Status
          </div>
          <div className="text-sm font-semibold">
            {skybitzStatus?.configured ? (
              <span className="text-green-600">Connected — {skybitzStatus.authMode}</span>
            ) : (
              <span className="text-gray-400">Not configured</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)} ({allGpsUnits.filter((u) => u.status === s).length})
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>
                {TRAILER_LABELS[t] ?? t} ({allGpsUnits.filter((u) => u.trailerType === t).length})
              </option>
            ))}
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          >
            <option value="all">All Customers</option>
            <option value="__available__">— Not Rented (Available) —</option>
            {uniqueCustomers.map((c) => (
              <option key={c} value={c}>
                {c} ({allGpsUnits.filter((u) => u.rentedTo === c).length})
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setTypeFilter('all')
                setCustomerFilter('all')
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredUnits.length} of {allGpsUnits.length} units
          </div>
        </div>
      </div>

      {/* Map controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMapStyle((s) => (s === 'light' ? 'satellite' : 'light'))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {mapStyle === 'light' ? (
              <>
                <Satellite className="h-3.5 w-3.5" /> Satellite
              </>
            ) : (
              <>
                <MapIcon className="h-3.5 w-3.5" /> Map
              </>
            )}
          </button>
        </div>
        <button
          onClick={refreshFromSkyBitz}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-blue text-brand-blue hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Refreshing...' : 'Refresh GPS'}
        </button>
      </div>

      {/* Map */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <div
          ref={mapContainer}
          className="w-full"
          style={{ height: '500px' }}
        />
      </div>

      {/* Unit list below map */}
      {filteredUnits.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {hasActiveFilters ? `Filtered Units (${filteredUnits.length})` : `Tracked Units (${filteredUnits.length})`}
            </h3>
            <div className="flex gap-3 text-xs">
              {Object.entries(STATUS_COLORS).map(([status, color]) => {
                const count = filteredUnits.filter(
                  (u) => u.status === status
                ).length
                if (count === 0) return null
                return (
                  <div key={status} className="flex items-center gap-1">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-600">
                      {statusLabel(status)} ({count})
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Unit #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Rented To
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Device ID
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Latitude
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Longitude
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUnits.map((unit) => (
                  <tr
                    key={unit.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedUnit?.id === unit.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedUnit(unit)
                      if (
                        mapRef.current &&
                        unit.latitude !== null &&
                        unit.longitude !== null
                      ) {
                        mapRef.current.flyTo({
                          center: [unit.longitude, unit.latitude],
                          zoom: 12,
                          duration: 1000,
                        })
                        // Open the popup for this unit
                        const marker = markersRef.current.find((m) => {
                          const lngLat = m.getLngLat()
                          return (
                            Math.abs(lngLat.lng - unit.longitude!) < 0.0001 &&
                            Math.abs(lngLat.lat - unit.latitude!) < 0.0001
                          )
                        })
                        marker?.togglePopup()
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {unit.unitNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {TRAILER_LABELS[unit.trailerType] ?? unit.trailerType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG[unit.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {statusLabel(unit.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {unit.rentedTo ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {unit.skybitzDeviceId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                      {unit.latitude?.toFixed(4) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                      {unit.longitude?.toFixed(4) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(unit.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
