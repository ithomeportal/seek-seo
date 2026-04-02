'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  RefreshCw,
  MapPin,
  Satellite,
  Map as MapIcon,
  Loader2,
  Truck,
  X,
  Search,
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
  lastLocation: string | null
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

const STATUS_RING: Record<string, string> = {
  available: 'ring-green-500 bg-green-50 text-green-700',
  rented: 'ring-blue-500 bg-blue-50 text-blue-700',
  damaged: 'ring-red-500 bg-red-50 text-red-700',
  for_sale: 'ring-purple-500 bg-purple-50 text-purple-700',
  maintenance: 'ring-yellow-500 bg-yellow-50 text-yellow-700',
}

const STATUS_SELECTED: Record<string, string> = {
  available: 'ring-2 ring-green-500 bg-green-100 text-green-800',
  rented: 'ring-2 ring-blue-500 bg-blue-100 text-blue-800',
  damaged: 'ring-2 ring-red-500 bg-red-100 text-red-800',
  for_sale: 'ring-2 ring-purple-500 bg-purple-100 text-purple-800',
  maintenance: 'ring-2 ring-yellow-500 bg-yellow-100 text-yellow-800',
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

/**
 * Offset overlapping markers in a spiral pattern so they don't stack.
 * Groups by rounded lat/lng (5-decimal precision ~1m) and offsets each
 * member by a small amount so all are visible when zoomed in.
 */
function offsetOverlapping(
  units: GPSUnit[]
): { unit: GPSUnit; lng: number; lat: number }[] {
  const groups = new Map<string, GPSUnit[]>()
  for (const u of units) {
    if (u.latitude === null || u.longitude === null) continue
    const key = `${u.latitude.toFixed(3)},${u.longitude.toFixed(3)}`
    const arr = groups.get(key) ?? []
    arr.push(u)
    groups.set(key, arr)
  }

  const result: { unit: GPSUnit; lng: number; lat: number }[] = []
  for (const members of groups.values()) {
    if (members.length === 1) {
      const u = members[0]
      result.push({ unit: u, lat: u.latitude!, lng: u.longitude! })
      continue
    }
    // Spiral offset — each marker gets a small nudge
    const OFFSET = 0.0008 // ~90 meters at this latitude
    for (let i = 0; i < members.length; i++) {
      const u = members[i]
      const angle = (2 * Math.PI * i) / members.length
      const ring = Math.floor(i / 8) + 1
      const r = OFFSET * ring
      result.push({
        unit: u,
        lat: u.latitude! + r * Math.sin(angle),
        lng: u.longitude! + r * Math.cos(angle),
      })
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GPSTrackingMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const initialFitDone = useRef(false)

  const [units, setUnits] = useState<GPSUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [skybitzStatus, setSkybitzStatus] = useState<SkyBitzStatus | null>(
    null
  )
  const [mapStyle, setMapStyle] = useState<'light' | 'satellite'>('light')
  const [mapReady, setMapReady] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<GPSUnit | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [customerSearch, setCustomerSearch] = useState('')

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
  // Defer creation until the container is painted and has dimensions.
  useEffect(() => {
    const container = mapContainer.current
    if (!container) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    const styleUrl =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12'

    // Wait for the browser to paint the container so it has a real size
    let cancelled = false
    const rafId = requestAnimationFrame(() => {
      if (cancelled || !container) return

      const map = new mapboxgl.Map({
        container,
        style: styleUrl,
        center: [-98.5, 30.0],
        zoom: 7,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      map.on('load', () => {
        if (!cancelled) setMapReady(true)
      })

      mapRef.current = map
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      initialFitDone.current = false
      setMapReady(false)
    }
  }, [mapStyle])

  // ------ Derived data ------
  const allGpsUnits = units.filter(
    (u) => u.latitude !== null && u.longitude !== null
  )
  const trackedCount = units.filter((u) => u.skybitzDeviceId !== null).length

  const filteredUnits = useMemo(
    () =>
      allGpsUnits.filter((u) => {
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
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [units, statusFilter, typeFilter, customerFilter]
  )

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
    if (!map || !mapReady) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds = new mapboxgl.LngLatBounds()
    let hasPoints = false

    const positioned = offsetOverlapping(filteredUnits)

    for (const { unit, lat, lng } of positioned) {
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
          ${unit.lastLocation ? `<div style="font-size:11px;color:#444;margin-top:4px;">📍 ${unit.lastLocation}</div>` : ''}
          <div style="font-size:10px;color:#999;margin-top:4px;">
            ${unit.latitude?.toFixed(4)}, ${unit.longitude?.toFixed(4)}
          </div>
        </div>
      `)

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([lng, lat])
      hasPoints = true
    }

    // Only auto-fit on first load — after that, keep user's zoom/pan
    if (hasPoints && !initialFitDone.current) {
      initialFitDone.current = true
      // Don't zoom out too far — cap at zoom 7 so SA area is clearly visible
      map.fitBounds(bounds, { padding: 60, maxZoom: 8 })
    }
  }, [filteredUnits, mapReady])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top row: KPI cards + clickable status pills */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* KPI cards */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="rounded-xl border bg-white px-4 py-3 min-w-[100px]">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
              <Truck className="h-3.5 w-3.5" /> Fleet
            </div>
            <div className="text-xl font-bold text-gray-900">{units.length}</div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 min-w-[100px]">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
              <MapPin className="h-3.5 w-3.5" /> GPS
            </div>
            <div className="text-xl font-bold text-gray-900">{allGpsUnits.length}</div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 min-w-[100px]">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
              <Satellite className="h-3.5 w-3.5" /> SkyBitz
            </div>
            <div className="text-xl font-bold text-gray-900">{trackedCount}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {skybitzStatus?.configured ? (
                <span className="text-green-600">{skybitzStatus.authMode}</span>
              ) : (
                'Not configured'
              )}
            </div>
          </div>
        </div>

        {/* Status pill buttons */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'ring-2 ring-gray-400 bg-gray-100 text-gray-800'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            All ({allGpsUnits.length})
          </button>
          {uniqueStatuses.map((s) => {
            const count = allGpsUnits.filter((u) => u.status === s).length
            if (count === 0) return null
            const isSelected = statusFilter === s
            return (
              <button
                key={s}
                onClick={() =>
                  setStatusFilter(statusFilter === s ? 'all' : s)
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? STATUS_SELECTED[s] ?? 'ring-2 ring-gray-400 bg-gray-100 text-gray-800'
                    : STATUS_RING[s]
                      ? STATUS_RING[s].replace('ring-', 'hover:ring-1 hover:ring-') + ' bg-white border border-gray-200'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s] }}
                />
                {statusLabel(s)} ({count})
              </button>
            )
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Type filter pills */}
          {uniqueTypes.map((t) => {
            const count = allGpsUnits.filter((u) => u.trailerType === t).length
            if (count === 0) return null
            const isSelected = typeFilter === t
            return (
              <button
                key={t}
                onClick={() =>
                  setTypeFilter(typeFilter === t ? 'all' : t)
                }
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'ring-2 ring-brand-blue bg-blue-50 text-brand-blue'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {TRAILER_LABELS[t] ?? t} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Customer search + map controls row */}
      <div className="flex items-center gap-3">
        {/* Customer search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value)
              if (e.target.value === '') setCustomerFilter('all')
            }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          />
          {customerSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  setCustomerFilter('__available__')
                  setCustomerSearch('Not Rented')
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                — Not Rented (Available) —
              </button>
              {uniqueCustomers
                .filter((c) =>
                  c.toLowerCase().includes(customerSearch.toLowerCase())
                )
                .map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCustomerFilter(c)
                      setCustomerSearch(c)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {c}{' '}
                    <span className="text-gray-400">
                      ({allGpsUnits.filter((u) => u.rentedTo === c).length})
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setStatusFilter('all')
              setTypeFilter('all')
              setCustomerFilter('all')
              setCustomerSearch('')
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}

        {hasActiveFilters && (
          <span className="text-sm text-gray-500">
            {filteredUnits.length} of {allGpsUnits.length}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
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
      </div>

      {/* Map */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <div
          ref={mapContainer}
          className="w-full"
          style={{ height: '540px' }}
        />
      </div>

      {/* Unit list below map */}
      {filteredUnits.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {hasActiveFilters
                ? `Filtered Units (${filteredUnits.length})`
                : `Tracked Units (${filteredUnits.length})`}
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
                    Location
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
                          zoom: 14,
                          duration: 1000,
                        })
                        const idx = filteredUnits.indexOf(unit)
                        if (idx >= 0 && markersRef.current[idx]) {
                          markersRef.current[idx].togglePopup()
                        }
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
                    <td className="px-4 py-3 text-gray-600">
                      {unit.lastLocation ?? '—'}
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
