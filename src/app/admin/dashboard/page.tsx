'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  BarChart3,
  Truck,
  MapPin,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  Loader2,
  Plus,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Building2,
  Phone,
  Mail,
} from 'lucide-react'
import { GPSTrackingMap } from '@/components/admin/GPSTrackingMap'

// ---------------------------------------------------------------------------
// Types (matching demo-data.ts shapes)
// ---------------------------------------------------------------------------

interface FleetStats {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  totalMonthlyRevenue: number
  utilizationRate: number
  availableCount: number
  rentedCount: number
  damagedCount: number
  forSaleCount: number
  maintenanceCount: number
}

interface FleetUnit {
  id: number
  unitNumber: string
  trailerType: string
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  status: string
  rentedTo: string | null
  rentedToContact: string | null
  rentalRate: string | null
  skybitzDeviceId: string | null
  lastLatitude: string | null
  lastLongitude: string | null
  notes: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

interface ContactSubmission {
  id: number
  name: string
  email: string
  phone: string | null
  company: string | null
  message: string
  type: string
  status: string
  createdAt: string
}

interface EquipmentForSale {
  id: number
  title: string
  trailerType: string
  year: number | null
  make: string | null
  model: string | null
  price: string | null
  description: string | null
  condition: string | null
  imageUrl: string | null
  isSold: number
  createdAt: string
}

interface ConcentrationRow {
  customer: string
  unitCount: number
  monthlyRevenue: number
  percentOfFleet: number
}

interface CustomerUnit {
  unitNumber: string
  trailerType: string
  status: string
  rentalRate: number | null
  depositTotal: number | null
  pendingDeposit: number | null
  rentStartDate: string | null
  rentDueDay: string | null
  vin: string | null
}

interface Customer {
  id: number
  companyName: string
  contactName: string | null
  phone: string | null
  email: string | null
  businessType: string | null
  stateFormed: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  insuranceCompany: string | null
  achAuthorized: boolean
  achBankName: string | null
  apEmail: string | null
  apPhone: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  unitsRented: number
  totalMonthlyRent: number
  totalDeposits: number
  totalPendingDeposits: number
  units: CustomerUnit[]
}

interface CustomerSummary {
  totalCustomers: number
  activeRenters: number
  totalMonthlyRevenue: number
  totalDepositsHeld: number
  totalPendingDeposits: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'overview' | 'fleet' | 'customers' | 'gps' | 'inquiries' | 'for_sale' | 'reports'

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'fleet', label: 'Fleet Master', icon: Truck },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'gps', label: 'GPS Tracking', icon: MapPin },
  { key: 'inquiries', label: 'Inquiries', icon: ClipboardList },
  { key: 'for_sale', label: 'For Sale Mgmt', icon: DollarSign },
  { key: 'reports', label: 'Reports', icon: FileText },
]

const TRAILER_TYPE_LABELS: Record<string, string> = {
  sand_chassis: 'Sand Chassis',
  belly_dump: 'Belly Dumps',
  sand_hopper: 'Sand Hoppers',
  dry_van: 'Dry Vans',
  flatbed: 'Flat Beds',
  tank: 'Tanks',
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  rented: 'bg-blue-100 text-blue-800',
  damaged: 'bg-red-100 text-red-800',
  for_sale: 'bg-purple-100 text-purple-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
}

const INQUIRY_TYPE_COLORS: Record<string, string> = {
  contact: 'bg-gray-100 text-gray-800',
  quote: 'bg-blue-100 text-blue-800',
  credit_app: 'bg-green-100 text-green-800',
}

const INQUIRY_STATUS_COLORS: Record<string, string> = {
  new: 'bg-orange-100 text-orange-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  responded: 'bg-green-100 text-green-800',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusLabel(s: string): string {
  return (s ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Auth
  const [authenticated, setAuthenticated] = useState(false)

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Read initial tab from URL ?tab=xxx, default to 'overview'
  const tabFromUrl = (searchParams.get('tab') ?? 'overview') as TabKey
  const validTab = TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : 'overview'
  const [activeTab, setActiveTabState] = useState<TabKey>(validTab)

  // Sync tab changes to URL
  const setActiveTab = useCallback(
    (tab: TabKey) => {
      setActiveTabState(tab)
      router.replace(`/admin/dashboard?tab=${tab}`, { scroll: false })
    },
    [router]
  )

  // Data
  const [stats, setStats] = useState<FleetStats | null>(null)
  const [fleet, setFleet] = useState<FleetUnit[]>([])
  const [inquiries, setInquiries] = useState<ContactSubmission[]>([])
  const [forSaleItems, setForSaleItems] = useState<EquipmentForSale[]>([])
  const [concentration, setConcentration] = useState<ConcentrationRow[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(null)

  // Customer filters
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState<'all' | 'active' | 'no_rentals'>('all')
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null)

  // Fleet filters
  const [fleetSearch, setFleetSearch] = useState('')
  const [fleetTypeFilter, setFleetTypeFilter] = useState('all')
  const [fleetStatusFilter, setFleetStatusFilter] = useState('all')

  // Add Unit modal
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [addUnitLoading, setAddUnitLoading] = useState(false)
  const [addUnitForm, setAddUnitForm] = useState({
    unitNumber: '',
    trailerType: 'sand_chassis',
    year: '',
    make: '',
    model: '',
    vin: '',
    purchasingCost: '',
    tireType: '',
    status: 'available',
    skybitzDeviceId: '',
    imageUrl: '',
    notes: '',
  })

  // Loading / error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ------ Auth check ------
  useEffect(() => {
    const auth = sessionStorage.getItem('seek_admin_auth')
    if (!auth) {
      router.push('/admin')
      return
    }
    setAuthenticated(true)
  }, [router])

  // ------ Data fetching ------
  const fetchData = useCallback(
    async (tab: TabKey) => {
      setLoading(true)
      setError('')
      try {
        switch (tab) {
          case 'overview': {
            const res = await fetch('/api/admin/fleet/stats')
            const json = await res.json()
            if (json.success) setStats(json.data)
            break
          }
          case 'fleet': {
            const res = await fetch('/api/admin/fleet')
            const json = await res.json()
            if (json.success) setFleet(json.data)
            break
          }
          case 'customers': {
            const res = await fetch('/api/admin/customers')
            const json = await res.json()
            if (json.success) {
              setCustomers(json.data.customers)
              setCustomerSummary(json.data.summary)
            }
            break
          }
          case 'inquiries': {
            const res = await fetch('/api/admin/inquiries')
            const json = await res.json()
            if (json.success) setInquiries(json.data)
            break
          }
          case 'for_sale': {
            const res = await fetch('/api/admin/for-sale')
            const json = await res.json()
            if (json.success) setForSaleItems(json.data)
            break
          }
          case 'reports': {
            const res = await fetch('/api/admin/fleet/concentration')
            const json = await res.json()
            if (json.success) setConcentration(json.data)
            break
          }
          case 'gps':
            // GPS tab manages its own data via GPSTrackingMap
            break
        }
      } catch {
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [fleet.length]
  )

  useEffect(() => {
    if (!authenticated) return
    fetchData(activeTab)
  }, [activeTab, authenticated, fetchData])

  // ------ Logout ------
  function handleLogout() {
    sessionStorage.removeItem('seek_admin_auth')
    router.push('/admin')
  }

  // ------ Fleet filtering ------
  const filteredFleet = fleet.filter((unit) => {
    const searchLower = fleetSearch.toLowerCase()
    const matchesSearch =
      fleetSearch === '' ||
      unit.unitNumber.toLowerCase().includes(searchLower) ||
      (unit.vin ?? '').toLowerCase().includes(searchLower) ||
      (unit.rentedTo ?? '').toLowerCase().includes(searchLower)
    const matchesType =
      fleetTypeFilter === 'all' || unit.trailerType === fleetTypeFilter
    const matchesStatus =
      fleetStatusFilter === 'all' || unit.status === fleetStatusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // ------ Add Unit handler ------
  async function handleAddUnit() {
    setAddUnitLoading(true)
    setError('')
    try {
      const payload = {
        unitNumber: addUnitForm.unitNumber.trim(),
        trailerType: addUnitForm.trailerType,
        year: addUnitForm.year ? parseInt(addUnitForm.year, 10) : null,
        make: addUnitForm.make.trim() || null,
        model: addUnitForm.model.trim() || null,
        vin: addUnitForm.vin.trim() || null,
        purchasingCost: addUnitForm.purchasingCost
          ? parseFloat(addUnitForm.purchasingCost)
          : null,
        tireType: addUnitForm.tireType.trim() || null,
        status: addUnitForm.status,
        skybitzDeviceId: addUnitForm.skybitzDeviceId.trim() || null,
        imageUrl: addUnitForm.imageUrl.trim() || null,
        notes: addUnitForm.notes.trim() || null,
      }

      const res = await fetch('/api/admin/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error ?? 'Failed to create unit')
        return
      }

      // Reset form and close modal
      setShowAddUnit(false)
      setAddUnitForm({
        unitNumber: '',
        trailerType: 'sand_chassis',
        year: '',
        make: '',
        model: '',
        vin: '',
        purchasingCost: '',
        tireType: '',
        status: 'available',
        skybitzDeviceId: '',
        imageUrl: '',
        notes: '',
      })

      // Refresh fleet data
      await fetchData('fleet')
    } catch {
      setError('Failed to create unit. Please try again.')
    } finally {
      setAddUnitLoading(false)
    }
  }

  // ------ Guard ------
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    )
  }

  // ------ Render helpers ------
  function renderBadge(text: string, colorClass: string) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {statusLabel(text)}
      </span>
    )
  }

  // ------ Tab content ------
  function renderOverview() {
    if (!stats) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )
    }
    const cards = [
      {
        label: 'Total Fleet',
        value: stats.total,
        color: 'bg-gray-900 text-white',
      },
      {
        label: 'Available',
        value: stats.availableCount,
        color: 'bg-green-50 text-green-700 border-green-200',
      },
      {
        label: 'Rented',
        value: stats.rentedCount,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      {
        label: 'Damaged',
        value: stats.damagedCount,
        color: 'bg-red-50 text-red-700 border-red-200',
      },
      {
        label: 'Maintenance',
        value: stats.maintenanceCount,
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      },
      {
        label: 'For Sale',
        value: stats.forSaleCount,
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      },
    ]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
              <p className="text-sm font-medium opacity-80">{c.label}</p>
              <p className="text-3xl font-bold mt-1">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-gradient-to-r from-brand-blue to-brand-blue/90 text-white p-8">
          <p className="text-sm font-medium opacity-80">
            Expected Monthly Revenue
          </p>
          <p className="text-4xl font-bold mt-2">
            {formatCurrency(stats.totalMonthlyRevenue)}
          </p>
          <p className="text-sm opacity-70 mt-1">
            Based on {stats.rentedCount} rented units (
            {stats.utilizationRate}% utilization)
          </p>
        </div>
      </div>
    )
  }

  function renderFleetMaster() {
    const inputClass =
      'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange'
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

    return (
      <div className="space-y-4">
        {/* Filters + Add button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search unit, VIN, or customer..."
              value={fleetSearch}
              onChange={(e) => setFleetSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-sm"
            />
          </div>
          <select
            value={fleetTypeFilter}
            onChange={(e) => setFleetTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
          >
            <option value="all">All Types</option>
            {Object.entries(TRAILER_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={fleetStatusFilter}
            onChange={(e) => setFleetStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="damaged">Damaged</option>
            <option value="maintenance">Maintenance</option>
            <option value="for_sale">For Sale</option>
          </select>
          <button
            onClick={() => setShowAddUnit(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/90 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add New Unit
          </button>
        </div>

        <p className="text-sm text-gray-500">
          {filteredFleet.length} units found
        </p>

        {/* Add New Unit Modal */}
        {showAddUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">
                  Add New Unit
                </h3>
                <button
                  onClick={() => setShowAddUnit(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Row 1: Unit Number + Trailer Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Unit Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addUnitForm.unitNumber}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          unitNumber: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. SC-001"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Trailer Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={addUnitForm.trailerType}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          trailerType: e.target.value,
                        })
                      }
                      className={inputClass}
                    >
                      {Object.entries(TRAILER_TYPE_LABELS).map(
                        ([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Row 2: Year + Make */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="number"
                      value={addUnitForm.year}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          year: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="2024"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Make</label>
                    <input
                      type="text"
                      value={addUnitForm.make}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          make: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. Heil"
                    />
                  </div>
                </div>

                {/* Row 3: Model + VIN */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Model</label>
                    <input
                      type="text"
                      value={addUnitForm.model}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          model: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. 9200 Gal"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>VIN</label>
                    <input
                      type="text"
                      value={addUnitForm.vin}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          vin: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="Vehicle ID number"
                    />
                  </div>
                </div>

                {/* Row 4: Purchasing Cost + Tire Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Purchasing Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={addUnitForm.purchasingCost}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          purchasingCost: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tire Type</label>
                    <input
                      type="text"
                      value={addUnitForm.tireType}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          tireType: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. 11R22.5"
                    />
                  </div>
                </div>

                {/* Row 5: Status + SkyBitz Device ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={addUnitForm.status}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          status: e.target.value,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="available">Available</option>
                      <option value="rented">Rented</option>
                      <option value="damaged">Damaged</option>
                      <option value="for_sale">For Sale</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>SkyBitz Device ID</label>
                    <input
                      type="text"
                      value={addUnitForm.skybitzDeviceId}
                      onChange={(e) =>
                        setAddUnitForm({
                          ...addUnitForm,
                          skybitzDeviceId: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="GPS tracker ID"
                    />
                  </div>
                </div>

                {/* Row 6: Image URL */}
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input
                    type="text"
                    value={addUnitForm.imageUrl}
                    onChange={(e) =>
                      setAddUnitForm({
                        ...addUnitForm,
                        imageUrl: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>

                {/* Row 7: Notes */}
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea
                    value={addUnitForm.notes}
                    onChange={(e) =>
                      setAddUnitForm({
                        ...addUnitForm,
                        notes: e.target.value,
                      })
                    }
                    className={inputClass}
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setShowAddUnit(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUnit}
                  disabled={
                    addUnitLoading || addUnitForm.unitNumber.trim() === ''
                  }
                  className="px-5 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
                >
                  {addUnitLoading ? 'Adding...' : 'Add Unit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border bg-white">
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
                  Year/Make/Model
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  VIN
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Rented To
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFleet.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {unit.unitNumber}
                  </td>
                  <td className="px-4 py-3">
                    {renderBadge(
                      unit.trailerType,
                      'bg-gray-100 text-gray-700'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[unit.year, unit.make, unit.model]
                      .filter(Boolean)
                      .join(' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {unit.vin ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {renderBadge(
                      unit.status,
                      STATUS_COLORS[unit.status] ?? 'bg-gray-100 text-gray-800'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {unit.rentedTo ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {unit.rentalRate
                      ? formatCurrency(parseFloat(unit.rentalRate)) + '/mo'
                      : '—'}
                  </td>
                </tr>
              ))}
              {filteredFleet.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No units match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderGPS() {
    return <GPSTrackingMap />
  }

  function renderInquiries() {
    if (inquiries.length === 0 && loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Company
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Message
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {inq.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {inq.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {inq.company ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {inq.message}
                  </td>
                  <td className="px-4 py-3">
                    {renderBadge(
                      inq.type,
                      INQUIRY_TYPE_COLORS[inq.type] ??
                        'bg-gray-100 text-gray-800'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {renderBadge(
                      inq.status,
                      INQUIRY_STATUS_COLORS[inq.status] ??
                        'bg-gray-100 text-gray-800'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDate(inq.createdAt)}
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No inquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderForSale() {
    if (forSaleItems.length === 0 && loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forSaleItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {item.title}
                </h3>
                {item.isSold === 1 && (
                  <span className="shrink-0 ml-2 inline-flex items-center rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-medium">
                    Sold
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-500">Type:</span>{' '}
                  {TRAILER_TYPE_LABELS[item.trailerType] ?? item.trailerType}
                </p>
                <p>
                  <span className="font-medium text-gray-500">
                    Year/Make/Model:
                  </span>{' '}
                  {[item.year, item.make, item.model].filter(Boolean).join(' ')}
                </p>
                {item.condition && (
                  <p>
                    <span className="font-medium text-gray-500">
                      Condition:
                    </span>{' '}
                    {statusLabel(item.condition)}
                  </p>
                )}
                {item.description && (
                  <p className="text-gray-400 text-xs">{item.description}</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <span className="text-lg font-bold text-brand-blue">
                  {item.price
                    ? formatCurrency(parseFloat(item.price))
                    : 'Contact us'}
                </span>
                {item.isSold === 0 && (
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-medium">
                    Available
                  </span>
                )}
              </div>
            </div>
          ))}
          {forSaleItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No items listed for sale.
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderCustomers() {
    if (!customerSummary) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )
    }

    const filtered = customers.filter((c) => {
      const searchLower = customerSearch.toLowerCase()
      const matchesSearch =
        customerSearch === '' ||
        c.companyName.toLowerCase().includes(searchLower) ||
        (c.contactName ?? '').toLowerCase().includes(searchLower) ||
        (c.email ?? '').toLowerCase().includes(searchLower)
      const matchesFilter =
        customerFilter === 'all' ||
        (customerFilter === 'active' && c.unitsRented > 0) ||
        (customerFilter === 'no_rentals' && c.unitsRented === 0)
      return matchesSearch && matchesFilter
    })

    const summaryCards = [
      {
        label: 'Total Customers',
        value: customerSummary.totalCustomers,
        color: 'bg-gray-900 text-white',
      },
      {
        label: 'Active Renters',
        value: customerSummary.activeRenters,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      {
        label: 'Monthly Revenue',
        value: formatCurrency(customerSummary.totalMonthlyRevenue),
        color: 'bg-green-50 text-green-700 border-green-200',
      },
      {
        label: 'Deposits Held',
        value: formatCurrency(customerSummary.totalDepositsHeld),
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      {
        label: 'Pending Deposits',
        value: formatCurrency(customerSummary.totalPendingDeposits),
        color: 'bg-orange-50 text-orange-700 border-orange-200',
      },
    ]

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards.map((c) => (
            <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
              <p className="text-sm font-medium opacity-80">{c.label}</p>
              <p className="text-2xl font-bold mt-1">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search company, contact, or email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-sm"
            />
          </div>
          <select
            value={customerFilter}
            onChange={(e) =>
              setCustomerFilter(
                e.target.value as 'all' | 'active' | 'no_rentals'
              )
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
          >
            <option value="all">All Customers</option>
            <option value="active">Active Renters</option>
            <option value="no_rentals">No Current Rentals</option>
          </select>
        </div>

        <p className="text-sm text-gray-500">
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Customer list */}
        <div className="space-y-3">
          {filtered.map((customer) => {
            const isExpanded = expandedCustomer === customer.id
            return (
              <div
                key={customer.id}
                className="rounded-xl border bg-white overflow-hidden"
              >
                {/* Customer header row */}
                <button
                  onClick={() =>
                    setExpandedCustomer(isExpanded ? null : customer.id)
                  }
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-brand-blue" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {customer.companyName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {customer.contactName && (
                          <span>{customer.contactName}</span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {customer.unitsRented > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900">
                          {customer.unitsRented} unit
                          {customer.unitsRented !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(customer.totalMonthlyRent)}/mo
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {customer.achAuthorized ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          ACH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-xs font-medium">
                          <XCircle className="h-3 w-3" />
                          No ACH
                        </span>
                      )}
                      {customer.unitsRented > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-500 px-2.5 py-0.5 text-xs font-medium">
                          No Rentals
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 px-5 py-4">
                    {/* Customer info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business Type
                        </p>
                        <p className="text-sm text-gray-900 mt-0.5">
                          {customer.businessType ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State Formed
                        </p>
                        <p className="text-sm text-gray-900 mt-0.5">
                          {customer.stateFormed ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Insurance
                        </p>
                        <p className="text-sm text-gray-900 mt-0.5">
                          {customer.insuranceCompany ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACH Bank
                        </p>
                        <p className="text-sm text-gray-900 mt-0.5">
                          {customer.achBankName ?? '—'}
                        </p>
                      </div>
                      {customer.address && (
                        <div className="col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Address
                          </p>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {[
                              customer.address,
                              customer.city,
                              customer.state,
                              customer.zip,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      )}
                      {customer.apEmail && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            A/P Email
                          </p>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {customer.apEmail}
                          </p>
                        </div>
                      )}
                      {customer.apPhone && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            A/P Phone
                          </p>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {customer.apPhone}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Rental Journal */}
                    {customer.units.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          Rental Journal
                        </h4>
                        <div className="overflow-x-auto rounded-lg border bg-white">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">
                                  Unit #
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">
                                  Type
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">
                                  VIN
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">
                                  Status
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500">
                                  Rent/Mo
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500">
                                  Deposit
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-500">
                                  Pending
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">
                                  Start Date
                                </th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">
                                  Due
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {customer.units.map((unit) => (
                                <tr
                                  key={unit.unitNumber}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 font-medium text-gray-900">
                                    {unit.unitNumber}
                                  </td>
                                  <td className="px-3 py-2">
                                    {renderBadge(
                                      unit.trailerType,
                                      'bg-gray-100 text-gray-700'
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                                    {unit.vin ?? '—'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {renderBadge(
                                      unit.status,
                                      STATUS_COLORS[unit.status] ??
                                        'bg-gray-100 text-gray-800'
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-600">
                                    {unit.rentalRate
                                      ? formatCurrency(unit.rentalRate)
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-600">
                                    {unit.depositTotal
                                      ? formatCurrency(unit.depositTotal)
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {unit.pendingDeposit ? (
                                      <span className="text-orange-600 font-medium">
                                        {formatCurrency(unit.pendingDeposit)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500 text-xs">
                                    {unit.rentStartDate
                                      ? formatDate(unit.rentStartDate)
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500 text-xs">
                                    {unit.rentDueDay ?? '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-medium">
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-3 py-2 text-gray-700"
                                >
                                  Totals ({customer.units.length} units)
                                </td>
                                <td className="px-3 py-2 text-right text-gray-900">
                                  {formatCurrency(customer.totalMonthlyRent)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-900">
                                  {formatCurrency(customer.totalDeposits)}
                                </td>
                                <td className="px-3 py-2 text-right text-orange-600">
                                  {customer.totalPendingDeposits > 0
                                    ? formatCurrency(
                                        customer.totalPendingDeposits
                                      )
                                    : '—'}
                                </td>
                                <td colSpan={2} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No units currently rented to this customer.
                      </p>
                    )}

                    {customer.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs font-medium text-yellow-800">
                          Notes
                        </p>
                        <p className="text-sm text-yellow-700 mt-0.5">
                          {customer.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No customers match your filters.
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderReports() {
    if (concentration.length === 0 && loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )
    }

    const totalRevenue = concentration.reduce(
      (sum, row) => sum + row.monthlyRevenue,
      0
    )

    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              Customer Concentration
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Revenue and fleet allocation by customer
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Units Rented
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    % of Fleet
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Monthly Revenue
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    % of Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {concentration.map((row) => {
                  const revenuePercent =
                    totalRevenue > 0
                      ? ((row.monthlyRevenue / totalRevenue) * 100).toFixed(1)
                      : '0.0'
                  return (
                    <tr key={row.customer} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.customer}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {row.unitCount}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {row.percentOfFleet}%
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(row.monthlyRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {revenuePercent}%
                      </td>
                    </tr>
                  )
                })}
                {concentration.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      No concentration data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const tabContent: Record<TabKey, () => React.JSX.Element> = {
    overview: renderOverview,
    fleet: renderFleetMaster,
    customers: renderCustomers,
    gps: renderGPS,
    inquiries: renderInquiries,
    for_sale: renderForSale,
    reports: renderReports,
  }

  const currentTabLabel =
    TABS.find((t) => t.key === activeTab)?.label ?? 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-gray-900 text-white transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="shrink-0 bg-white rounded-lg p-1.5">
            <Image
              src="/images/logo/logo.png"
              alt="SEEK Equipment"
              width={sidebarOpen ? 120 : 28}
              height={sidebarOpen ? 40 : 10}
              className={sidebarOpen ? 'h-8 w-auto' : 'h-5 w-auto'}
            />
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="flex items-center justify-center py-2 text-gray-400 hover:text-white transition-colors border-b border-gray-700"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-blue text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={tab.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Bottom links */}
        <div className="border-t border-gray-700 py-3 space-y-1">
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            title="Back to main site"
          >
            <Home className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Back to Site</span>}
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex items-center justify-between bg-white border-b px-6 py-4 shrink-0">
          <h1 className="text-xl font-bold text-gray-900">
            {currentTabLabel}
          </h1>
          <button
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg p-4 mb-6 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {tabContent[activeTab]()}
        </main>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
