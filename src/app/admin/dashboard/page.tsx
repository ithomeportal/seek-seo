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
  Receipt,
  CreditCard,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { GPSTrackingMap } from '@/components/admin/GPSTrackingMap'
import { UploadButton } from '@/lib/uploadthing'

// ---------------------------------------------------------------------------
// Types (matching demo-data.ts shapes)
// ---------------------------------------------------------------------------

interface FleetTypeBreakdown {
  type: string
  total: number
  rented: number
}

interface TopCustomer {
  name: string
  units: number
  revenue: number
  deposits: number
  percentOfFleet: number
}

interface FleetStats {
  total: number
  available: number
  rented: number
  damaged: number
  maintenance: number
  forSale: number
  sold: number
  expectedMonthlyRevenue: number
  utilizationRate: number
  totalDepositsHeld: number
  totalPendingDeposits: number
  activeCustomers: number
  byType: FleetTypeBreakdown[]
  topCustomers: TopCustomer[]
}

interface FleetUnit {
  id: number
  unitNumber: string
  trailerType: string
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  purchasingCost: string | null
  tireType: string | null
  status: string
  rentedTo: string | null
  rentedToContact: string | null
  rentalRate: string | null
  depositTotal: string | null
  pendingDeposit: string | null
  rentStartDate: string | null
  rentDueDay: string | null
  skybitzDeviceId: string | null
  lastLatitude: string | null
  lastLongitude: string | null
  notes: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

interface UnitDocument {
  id: number
  unitId: number
  fileName: string
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  uploadedAt: string
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
  alias: string | null
  qbDisplayName: string | null
  qbBalance: number | null
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

interface QBInvoice {
  docNumber: string
  customerName: string
  totalAmt: number
  balance: number
  dueDate: string | null
  txnDate: string | null
  status: string
}

interface QBInvoiceSummary {
  totalInvoices: number
  openCount: number
  paidCount: number
  totalOutstanding: number
  overdueCount: number
  totalOverdue: number
}

interface QBPayment {
  customerName: string
  totalAmt: number
  txnDate: string | null
  paymentMethod: string | null
}

interface QBPaymentSummary {
  totalPayments: number
  totalCollected: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'overview' | 'fleet' | 'customers' | 'invoices' | 'payments' | 'gps' | 'inquiries' | 'for_sale' | 'reports'

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'fleet', label: 'Fleet Master', icon: Truck },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'payments', label: 'Payments', icon: CreditCard },
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
  sold: 'bg-gray-200 text-gray-600',
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
      setSortKey('')
      setSortDir('asc')
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
  const [qbInvoices, setQbInvoices] = useState<QBInvoice[]>([])
  const [qbInvoiceSummary, setQbInvoiceSummary] = useState<QBInvoiceSummary | null>(null)
  const [qbPayments, setQbPayments] = useState<QBPayment[]>([])
  const [qbPaymentSummary, setQbPaymentSummary] = useState<QBPaymentSummary | null>(null)
  const [qbSyncStatus, setQbSyncStatus] = useState<Record<string, { syncedAt: string }>>({})
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'Open' | 'Paid' | 'Overdue'>('all')
  const [paymentSearch, setPaymentSearch] = useState('')

  // Customer filters
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState<'all' | 'active' | 'no_rentals'>('all')
  const [customerSort, setCustomerSort] = useState<'name' | 'units' | 'revenue' | 'deposits'>('name')
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

  // Edit Unit modal
  const [editUnit, setEditUnit] = useState<FleetUnit | null>(null)
  const [editUnitLoading, setEditUnitLoading] = useState(false)
  const [unitDocs, setUnitDocs] = useState<UnitDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [editUnitForm, setEditUnitForm] = useState({
    unitNumber: '',
    trailerType: 'sand_chassis',
    year: '',
    make: '',
    model: '',
    vin: '',
    purchasingCost: '',
    tireType: '',
    status: 'available',
    rentedTo: '',
    rentedToContact: '',
    rentalRate: '',
    depositTotal: '',
    pendingDeposit: '',
    rentStartDate: '',
    rentDueDay: '',
    skybitzDeviceId: '',
    imageUrl: '',
    notes: '',
  })

  // Sort state (must be before guard/early-return)
  const [sortKey, setSortKey] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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
            const [fleetRes, custRes, statsRes] = await Promise.all([
              fetch('/api/admin/fleet'),
              fetch('/api/admin/customers'),
              fetch('/api/admin/fleet/stats'),
            ])
            const fleetJson = await fleetRes.json()
            if (fleetJson.success) setFleet(fleetJson.data)
            const custJson = await custRes.json()
            if (custJson.success) {
              setCustomers(custJson.data.customers)
              setCustomerSummary(custJson.data.summary)
            }
            const statsJson = await statsRes.json()
            if (statsJson.success) setStats(statsJson.data)
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
          case 'invoices': {
            const [invRes, syncRes] = await Promise.all([
              fetch('/api/admin/qb/invoices'),
              fetch('/api/admin/qb/sync-status'),
            ])
            const invJson = await invRes.json()
            if (invJson.success) {
              setQbInvoices(invJson.data.invoices)
              setQbInvoiceSummary(invJson.data.summary)
            }
            const syncJson = await syncRes.json()
            if (syncJson.success) setQbSyncStatus(syncJson.data)
            break
          }
          case 'payments': {
            const [payRes, syncRes] = await Promise.all([
              fetch('/api/admin/qb/payments'),
              fetch('/api/admin/qb/sync-status'),
            ])
            const payJson = await payRes.json()
            if (payJson.success) {
              setQbPayments(payJson.data.payments)
              setQbPaymentSummary(payJson.data.summary)
            }
            const syncJson = await syncRes.json()
            if (syncJson.success) setQbSyncStatus(syncJson.data)
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

  // Historical sales toggle
  const [showHistoricalSales, setShowHistoricalSales] = useState(false)

  // ------ Fleet filtering ------
  const filteredFleet = fleet.filter((unit) => {
    // Exclude sold units from main fleet view (they appear in Historical Sales)
    if (!showHistoricalSales && unit.status === 'sold') return false
    if (showHistoricalSales) return unit.status === 'sold'
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

  // ------ Edit Unit helpers ------
  async function fetchUnitDocs(unitId: number) {
    setDocsLoading(true)
    try {
      const res = await fetch(`/api/admin/fleet/documents?unitId=${unitId}`)
      const json = await res.json()
      if (json.success) setUnitDocs(json.data)
    } catch {
      /* ignore */
    } finally {
      setDocsLoading(false)
    }
  }

  async function deleteDoc(docId: number) {
    try {
      await fetch(`/api/admin/fleet/documents?id=${docId}`, { method: 'DELETE' })
      setUnitDocs((prev) => prev.filter((d) => d.id !== docId))
    } catch {
      /* ignore */
    }
  }

  function openEditUnit(unit: FleetUnit) {
    setEditUnitForm({
      unitNumber: unit.unitNumber,
      trailerType: unit.trailerType,
      year: unit.year?.toString() ?? '',
      make: unit.make ?? '',
      model: unit.model ?? '',
      vin: unit.vin ?? '',
      purchasingCost: unit.purchasingCost ?? '',
      tireType: unit.tireType ?? '',
      status: unit.status,
      rentedTo: unit.rentedTo ?? '',
      rentedToContact: unit.rentedToContact ?? '',
      rentalRate: unit.rentalRate ?? '',
      depositTotal: unit.depositTotal ?? '',
      pendingDeposit: unit.pendingDeposit ?? '',
      rentStartDate: unit.rentStartDate
        ? unit.rentStartDate.split('T')[0]
        : '',
      rentDueDay: unit.rentDueDay ?? '',
      skybitzDeviceId: unit.skybitzDeviceId ?? '',
      imageUrl: unit.imageUrl ?? '',
      notes: unit.notes ?? '',
    })
    setEditUnit(unit)
    fetchUnitDocs(unit.id)
  }

  async function handleEditUnit() {
    if (!editUnit) return
    setEditUnitLoading(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        unitNumber: editUnitForm.unitNumber.trim(),
        trailerType: editUnitForm.trailerType,
        year: editUnitForm.year ? parseInt(editUnitForm.year, 10) : null,
        make: editUnitForm.make.trim() || null,
        model: editUnitForm.model.trim() || null,
        vin: editUnitForm.vin.trim() || null,
        purchasingCost: editUnitForm.purchasingCost
          ? parseFloat(editUnitForm.purchasingCost)
          : null,
        tireType: editUnitForm.tireType.trim() || null,
        status: editUnitForm.status,
        rentedTo: editUnitForm.rentedTo.trim() || null,
        rentedToContact: editUnitForm.rentedToContact.trim() || null,
        rentalRate: editUnitForm.rentalRate
          ? parseFloat(editUnitForm.rentalRate)
          : null,
        depositTotal: editUnitForm.depositTotal
          ? parseFloat(editUnitForm.depositTotal)
          : null,
        pendingDeposit: editUnitForm.pendingDeposit
          ? parseFloat(editUnitForm.pendingDeposit)
          : null,
        rentStartDate: editUnitForm.rentStartDate || null,
        rentDueDay: editUnitForm.rentDueDay.trim() || null,
        skybitzDeviceId: editUnitForm.skybitzDeviceId.trim() || null,
        imageUrl: editUnitForm.imageUrl.trim() || null,
        notes: editUnitForm.notes.trim() || null,
      }

      const res = await fetch(`/api/admin/fleet/${editUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error ?? 'Failed to update unit')
        return
      }

      setEditUnit(null)
      await fetchData('fleet')
    } catch {
      setError('Failed to update unit. Please try again.')
    } finally {
      setEditUnitLoading(false)
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

  // ------ Sort helpers ------
  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function genericSort<T>(rows: T[], getVal: (row: T) => string | number | null | undefined): T[] {
    if (!sortKey) return rows
    return [...rows].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }

  function renderSortHeader(label: string, sortId: string, align?: 'left' | 'right' | 'center') {
    const isActive = sortKey === sortId
    return (
      <th
        className={`px-2.5 py-2 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        }`}
        onClick={() => handleSort(sortId)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive && (
            <span className="text-brand-orange">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
          )}
          {!isActive && <span className="text-gray-300">{'\u25B4'}</span>}
        </span>
      </th>
    )
  }

  // ------ Render helpers ------
  function renderBadge(text: string, colorClass: string) {
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${colorClass}`}>
        {statusLabel(text)}
      </span>
    )
  }

  // ------ Tab content ------
  function renderOverview() {
    if (!stats) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      )
    }

    const fleetCards = [
      { label: 'Total', value: stats.total, color: 'bg-gray-900 text-white' },
      { label: 'Available', value: stats.available, color: 'bg-green-50 text-green-700' },
      { label: 'Rented', value: stats.rented, color: 'bg-blue-50 text-blue-700' },
      { label: 'Damaged', value: stats.damaged, color: 'bg-red-50 text-red-700' },
      { label: 'Maint.', value: stats.maintenance, color: 'bg-yellow-50 text-yellow-700' },
      ...(stats.sold > 0 ? [{ label: 'Sold', value: stats.sold, color: 'bg-gray-100 text-gray-500' }] : []),
    ]

    return (
      <div className="space-y-4">
        {/* Row 1: Fleet cards + Revenue */}
        <div className="grid grid-cols-6 lg:grid-cols-10 gap-2">
          {fleetCards.map((c) => (
            <div key={c.label} className={`rounded-lg p-3 ${c.color}`}>
              <p className="text-xs font-semibold uppercase opacity-70 leading-tight">{c.label}</p>
              <p className="text-3xl font-bold">{c.value}</p>
            </div>
          ))}
          <div className="col-span-6 lg:col-span-4 rounded-lg bg-brand-orange text-white p-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase opacity-80">Monthly Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.expectedMonthlyRevenue)}</p>
            </div>
            <div className="text-right text-xs opacity-80 hidden sm:block">
              <p>{stats.utilizationRate}% utilization</p>
              <p>{stats.activeCustomers} active customers</p>
            </div>
          </div>
        </div>

        {/* Row 2: Deposits + Utilization bars + Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Deposits */}
          <div className="rounded-lg border bg-white p-3">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Deposits</h3>
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-xs text-gray-500">Held</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalDepositsHeld)}</p>
              </div>
              {stats.totalPendingDeposits > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalPendingDeposits)}</p>
                </div>
              )}
            </div>
            {/* Fleet by Type */}
            <div className="mt-3 pt-3 border-t space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Fleet by Type</h3>
              {stats.byType.map((t) => {
                const util = t.total > 0 ? Math.round((t.rented / t.total) * 100) : 0
                return (
                  <div key={t.type}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium text-gray-700">
                        {TRAILER_TYPE_LABELS[t.type] ?? statusLabel(t.type)}
                      </span>
                      <span className="text-gray-400">{t.rented}/{t.total} ({util}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue rounded-full" style={{ width: `${util}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Customers — spans 2 cols */}
          <div className="lg:col-span-2 rounded-lg border bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50">
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Top Customers</h3>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-3 py-1.5 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">Units</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">% Fleet</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">Revenue/Mo</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-500">Deposits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.topCustomers.map((c) => (
                  <tr key={c.name} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-medium text-gray-900">{c.name}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{c.units}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{c.percentOfFleet}%</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{formatCurrency(c.revenue)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{formatCurrency(c.deposits)}</td>
                  </tr>
                ))}
                {stats.topCustomers.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No active rentals yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderFleetMaster() {
    const inputClass =
      'w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/50 focus:border-brand-orange'
    const labelClass = 'block text-xs font-semibold text-gray-600 mb-0.5'

    // Compute fleet KPIs from loaded data
    const activeFleet = fleet.filter((u) => u.status !== 'sold')
    const rentedUnits = activeFleet.filter((u) => u.status === 'rented')
    const availableUnits = activeFleet.filter((u) => u.status === 'available')
    const uniqueTypes = new Set(activeFleet.map((u) => u.trailerType))
    const uniqueCompanies = new Set(rentedUnits.map((u) => u.rentedTo).filter(Boolean))
    const totalMonthlyRevenue = rentedUnits.reduce(
      (sum, u) => sum + (u.rentalRate ? parseFloat(u.rentalRate) : 0),
      0
    )
    const totalDeposits = activeFleet.reduce(
      (sum, u) => sum + (u.depositTotal ? parseFloat(u.depositTotal) : 0),
      0
    )
    const totalPendingDep = activeFleet.reduce(
      (sum, u) => sum + (u.pendingDeposit ? parseFloat(u.pendingDeposit) : 0),
      0
    )
    const totalAssetValue = activeFleet.reduce(
      (sum, u) => sum + (u.purchasingCost ? parseFloat(u.purchasingCost) : 0),
      0
    )
    const utilization = activeFleet.length > 0
      ? Math.round((rentedUnits.length / activeFleet.length) * 1000) / 10
      : 0

    // Average contract length (months from rent start to now)
    const now = new Date()
    const contractMonths = rentedUnits
      .filter((u) => u.rentStartDate)
      .map((u) => {
        const start = new Date(u.rentStartDate!)
        return (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
      })
    const avgContractMonths = contractMonths.length > 0
      ? Math.round(contractMonths.reduce((a, b) => a + b, 0) / contractMonths.length)
      : 0
    // Annual revenue forecast based on current rentals
    const annualForecast = totalMonthlyRevenue * 12

    // Type breakdown for mini-table
    const typeBreakdown = Object.entries(TRAILER_TYPE_LABELS).map(([key, label]) => {
      const typeUnits = activeFleet.filter((u) => u.trailerType === key)
      const typeRented = typeUnits.filter((u) => u.status === 'rented')
      return { key, label, total: typeUnits.length, rented: typeRented.length }
    }).filter((t) => t.total > 0)

    return (
      <div className="space-y-2">
        {/* KPI Summary — single compact row */}
        {!showHistoricalSales && (
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="rounded-lg px-2.5 py-1.5 bg-gray-900 text-white">
              <p className="text-[10px] font-semibold uppercase opacity-70 leading-tight">Fleet</p>
              <p className="text-lg font-bold leading-tight">{activeFleet.length}</p>
            </div>
            <div className="rounded-lg px-2.5 py-1.5 bg-green-50 text-green-700">
              <p className="text-[10px] font-semibold uppercase opacity-70 leading-tight">Avail</p>
              <p className="text-lg font-bold leading-tight">{availableUnits.length}</p>
            </div>
            <div className="rounded-lg px-2.5 py-1.5 bg-blue-50 text-blue-700">
              <p className="text-[10px] font-semibold uppercase opacity-70 leading-tight">Rented</p>
              <p className="text-lg font-bold leading-tight">{rentedUnits.length}</p>
            </div>
            <div className="rounded-lg px-2.5 py-1.5 bg-teal-50 text-teal-700">
              <p className="text-[10px] font-semibold uppercase opacity-70 leading-tight">Companies</p>
              <p className="text-lg font-bold leading-tight">{uniqueCompanies.size}</p>
            </div>
            <div className="rounded-lg px-2.5 py-1.5 bg-brand-orange/10 text-brand-orange">
              <p className="text-[10px] font-semibold uppercase opacity-70 leading-tight">Util.</p>
              <p className="text-lg font-bold leading-tight">{utilization}%</p>
            </div>
            <div className="rounded-lg px-2.5 py-1.5 bg-brand-orange text-white">
              <p className="text-[10px] font-semibold uppercase opacity-80 leading-tight">Rev/Mo</p>
              <p className="text-lg font-bold leading-tight">{formatCurrency(totalMonthlyRevenue)}</p>
            </div>
            <div className="rounded-lg px-2.5 py-1.5 border bg-white">
              <p className="text-[10px] font-semibold uppercase text-gray-400 leading-tight">Forecast/Yr</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{formatCurrency(annualForecast)}</p>
            </div>
            <div className="rounded-lg px-2.5 py-1.5 border bg-white">
              <p className="text-[10px] font-semibold uppercase text-gray-400 leading-tight">Deposits</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{formatCurrency(totalDeposits)}</p>
            </div>
            {totalPendingDep > 0 && (
              <div className="rounded-lg px-2.5 py-1.5 border bg-white">
                <p className="text-[10px] font-semibold uppercase text-gray-400 leading-tight">Pending</p>
                <p className="text-lg font-bold text-orange-600 leading-tight">{formatCurrency(totalPendingDep)}</p>
              </div>
            )}
            {totalAssetValue > 0 && (
              <div className="rounded-lg px-2.5 py-1.5 border bg-white">
                <p className="text-[10px] font-semibold uppercase text-gray-400 leading-tight">Assets</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{formatCurrency(totalAssetValue)}</p>
              </div>
            )}
            {avgContractMonths > 0 && (
              <div className="rounded-lg px-2.5 py-1.5 border bg-white">
                <p className="text-[10px] font-semibold uppercase text-gray-400 leading-tight">Avg Contract</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{avgContractMonths} mo</p>
              </div>
            )}
            <div className="rounded-lg px-2.5 py-1.5 border bg-white">
              <p className="text-[10px] font-semibold uppercase text-gray-400 leading-tight">Rev/Unit</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{rentedUnits.length > 0 ? formatCurrency(totalMonthlyRevenue / rentedUnits.length) : '—'}</p>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-0.5" />
            {typeBreakdown.map((t) => (
              <div key={t.key} className="rounded-lg px-2 py-1.5 border bg-white flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-gray-600">{t.label}</span>
                <span className="text-[10px] text-gray-400">{t.rented}/{t.total}</span>
                <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-blue rounded-full" style={{ width: `${t.total > 0 ? (t.rented / t.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters — responsive: inline on desktop, wraps on mobile */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search unit, VIN, or customer..."
              value={fleetSearch}
              onChange={(e) => setFleetSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue/50 text-xs"
            />
          </div>
          <select
            value={fleetTypeFilter}
            onChange={(e) => setFleetTypeFilter(e.target.value)}
            className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
          >
            <option value="all">All Types</option>
            {Object.entries(TRAILER_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={fleetStatusFilter}
            onChange={(e) => setFleetStatusFilter(e.target.value)}
            className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
            disabled={showHistoricalSales}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="damaged">Damaged</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <button
            onClick={() => setShowHistoricalSales(!showHistoricalSales)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
              showHistoricalSales
                ? 'bg-gray-800 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {showHistoricalSales ? 'Back to Fleet' : 'Historical Sales'}
          </button>
          <button
            onClick={() => setShowAddUnit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-orange text-white text-xs font-medium hover:bg-brand-orange/90 transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Unit
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            {showHistoricalSales
              ? `${filteredFleet.length} sold`
              : `${filteredFleet.length} units`}
          </span>
        </div>

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
                      <option value="maintenance">Maintenance</option>
                      <option value="sold">Sold</option>
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

                {/* Row 6: Documents note */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                  <p className="text-xs text-blue-700">
                    <strong>Documents & Photos:</strong> You can upload files after creating the unit. Click &quot;Edit&quot; on the unit to add photos, documents, and other files.
                  </p>
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

        {/* Edit Unit Modal */}
        {editUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">
                  Edit Unit: {editUnit.unitNumber}
                </h3>
                <button
                  onClick={() => setEditUnit(null)}
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
                      value={editUnitForm.unitNumber}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          unitNumber: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Trailer Type</label>
                    <select
                      value={editUnitForm.trailerType}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
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

                {/* Row 2: Year + Make + Model */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="number"
                      value={editUnitForm.year}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          year: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Make</label>
                    <input
                      type="text"
                      value={editUnitForm.make}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          make: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Model</label>
                    <input
                      type="text"
                      value={editUnitForm.model}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          model: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Row 3: VIN + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>VIN</label>
                    <input
                      type="text"
                      value={editUnitForm.vin}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          vin: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={editUnitForm.status}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          status: e.target.value,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="available">Available</option>
                      <option value="rented">Rented</option>
                      <option value="damaged">Damaged</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>

                {/* Rental Section */}
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Rental Details
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Rented To</label>
                      <input
                        type="text"
                        value={editUnitForm.rentedTo}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            rentedTo: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Contact</label>
                      <input
                        type="text"
                        value={editUnitForm.rentedToContact}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            rentedToContact: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="Contact person"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className={labelClass}>Rental Rate ($/mo)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUnitForm.rentalRate}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            rentalRate: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Deposit Total ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUnitForm.depositTotal}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            depositTotal: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Pending Deposit ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUnitForm.pendingDeposit}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            pendingDeposit: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className={labelClass}>Rent Start Date</label>
                      <input
                        type="date"
                        value={editUnitForm.rentStartDate}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            rentStartDate: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Due Day</label>
                      <input
                        type="text"
                        value={editUnitForm.rentDueDay}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            rentDueDay: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="e.g. 1st, 15th"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional fields */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        Purchasing Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUnitForm.purchasingCost}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            purchasingCost: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tire Type</label>
                      <input
                        type="text"
                        value={editUnitForm.tireType}
                        onChange={(e) =>
                          setEditUnitForm({
                            ...editUnitForm,
                            tireType: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={labelClass}>SkyBitz Device ID</label>
                    <input
                      type="text"
                      value={editUnitForm.skybitzDeviceId}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          skybitzDeviceId: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>

                  {/* Documents & Photos Upload */}
                  <div className="mt-4 border-t pt-4">
                    <label className={labelClass}>Documents & Photos</label>
                    <div className="mt-2">
                      <UploadButton
                        endpoint="unitDocuments"
                        onClientUploadComplete={(res) => {
                          if (!editUnit) return
                          for (const file of res) {
                            fetch('/api/admin/fleet/documents', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                unitId: editUnit.id,
                                fileName: file.name,
                                fileUrl: file.ufsUrl,
                                fileType: file.type,
                                fileSize: file.size,
                              }),
                            })
                          }
                          // Refresh docs list
                          if (editUnit) fetchUnitDocs(editUnit.id)
                        }}
                        onUploadError={(err: Error) => {
                          setError(`Upload failed: ${err.message}`)
                        }}
                        appearance={{
                          button: 'bg-brand-orange text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-brand-orange/90',
                          allowedContent: 'text-xs text-gray-400',
                        }}
                      />
                    </div>
                    {/* Documents list */}
                    {docsLoading ? (
                      <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading files...
                      </div>
                    ) : unitDocs.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {unitDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-gray-50 border text-xs"
                          >
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-blue hover:underline font-medium truncate flex-1"
                            >
                              {doc.fileName}
                            </a>
                            <span className="text-gray-400 shrink-0">
                              {doc.fileSize ? `${Math.round(doc.fileSize / 1024)}KB` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteDoc(doc.id)}
                              className="text-red-400 hover:text-red-600 shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2 italic">No documents uploaded yet.</p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className={labelClass}>Notes</label>
                    <textarea
                      value={editUnitForm.notes}
                      onChange={(e) =>
                        setEditUnitForm({
                          ...editUnitForm,
                          notes: e.target.value,
                        })
                      }
                      className={inputClass}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setEditUnit(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUnit}
                  disabled={
                    editUnitLoading || editUnitForm.unitNumber.trim() === ''
                  }
                  className="px-5 py-2 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
                >
                  {editUnitLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {renderSortHeader("Unit #", "unitNumber")}
                {renderSortHeader("Type", "trailerType")}
                {renderSortHeader("Year/Make/Model", "year")}
                {renderSortHeader("VIN", "vin")}
                {renderSortHeader("Status", "status")}
                {renderSortHeader("Rented To", "rentedTo")}
                {renderSortHeader("Rate", "rentalRate", "right")}
                {renderSortHeader("Deposit", "depositTotal", "right")}
                <th className="px-2.5 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {genericSort(filteredFleet, (u) => {
                switch (sortKey) {
                  case 'unitNumber': return u.unitNumber
                  case 'trailerType': return u.trailerType
                  case 'year': return u.year
                  case 'vin': return u.vin
                  case 'status': return u.status
                  case 'rentedTo': return u.rentedTo
                  case 'rentalRate': return u.rentalRate ? parseFloat(u.rentalRate) : null
                  case 'depositTotal': return u.depositTotal ? parseFloat(u.depositTotal) : null
                  default: return null
                }
              }).map((unit) => (
                <tr key={unit.id} className="hover:bg-blue-50/40">
                  <td className="px-2.5 py-1.5 font-semibold text-gray-900 whitespace-nowrap">{unit.unitNumber}</td>
                  <td className="px-2.5 py-1.5">
                    <span className="text-gray-500">{TRAILER_TYPE_LABELS[unit.trailerType] ?? unit.trailerType}</span>
                  </td>
                  <td className="px-2.5 py-1.5 text-gray-600">
                    {[unit.year, unit.make, unit.model].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-2.5 py-1.5 text-gray-400 font-mono text-xs">{unit.vin ?? '—'}</td>
                  <td className="px-2.5 py-1.5">
                    {renderBadge(unit.status, STATUS_COLORS[unit.status] ?? 'bg-gray-100 text-gray-800')}
                  </td>
                  <td className="px-2.5 py-1.5">
                    {unit.rentedTo ? (() => {
                      const cust = customers.find(
                        (c) =>
                          c.alias?.toLowerCase() === unit.rentedTo?.toLowerCase() ||
                          c.companyName.toLowerCase() === unit.rentedTo?.toLowerCase() ||
                          c.qbDisplayName?.toLowerCase() === unit.rentedTo?.toLowerCase() ||
                          c.companyName.toLowerCase().includes(unit.rentedTo?.toLowerCase() ?? '') ||
                          (unit.rentedTo?.toLowerCase() ?? '').includes(c.companyName.toLowerCase().split(' ')[0])
                      )
                      const displayName = cust?.qbDisplayName ?? cust?.companyName ?? unit.rentedTo
                      const alias = cust?.alias && cust.alias !== displayName ? cust.alias : null
                      return (
                        <button
                          onClick={() => {
                            setActiveTab('customers')
                            if (cust) setTimeout(() => setExpandedCustomer(cust.id), 200)
                          }}
                          className="text-left text-brand-blue hover:underline font-medium"
                        >
                          {displayName}
                          {alias && <span className="text-gray-400 font-normal ml-1">({alias})</span>}
                        </button>
                      )
                    })() : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-2.5 py-1.5 text-right text-gray-600 tabular-nums">
                    {unit.rentalRate ? formatCurrency(parseFloat(unit.rentalRate)) : '—'}
                  </td>
                  <td className="px-2.5 py-1.5 text-right text-gray-600 tabular-nums">
                    {unit.depositTotal ? formatCurrency(parseFloat(unit.depositTotal)) : '—'}
                  </td>
                  <td className="px-2.5 py-1.5 text-center">
                    <button
                      onClick={() => openEditUnit(unit)}
                      className="px-2 py-0.5 rounded text-xs font-medium text-brand-blue hover:bg-brand-blue/10 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFleet.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No units match your filters.</td></tr>
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      )
    }

    return (
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {renderSortHeader("Name", "inqName")}
              {renderSortHeader("Email", "inqEmail")}
              {renderSortHeader("Company", "inqCompany")}
              {renderSortHeader("Message", "inqMessage")}
              {renderSortHeader("Type", "inqType")}
              {renderSortHeader("Status", "inqStatus")}
              {renderSortHeader("Date", "inqDate")}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {genericSort(inquiries, (inq) => {
              switch (sortKey) {
                case 'inqName': return inq.name
                case 'inqEmail': return inq.email
                case 'inqCompany': return inq.company
                case 'inqType': return inq.type
                case 'inqStatus': return inq.status
                case 'inqDate': return inq.createdAt
                default: return null
              }
            }).map((inq) => (
              <tr key={inq.id} className="hover:bg-blue-50/40">
                <td className="px-2.5 py-1.5 font-medium text-gray-900 whitespace-nowrap">{inq.name}</td>
                <td className="px-2.5 py-1.5 text-gray-600 whitespace-nowrap">{inq.email}</td>
                <td className="px-2.5 py-1.5 text-gray-600 whitespace-nowrap">{inq.company ?? '—'}</td>
                <td className="px-2.5 py-1.5 text-gray-500 max-w-[200px] truncate">{inq.message}</td>
                <td className="px-2.5 py-1.5">{renderBadge(inq.type, INQUIRY_TYPE_COLORS[inq.type] ?? 'bg-gray-100 text-gray-800')}</td>
                <td className="px-2.5 py-1.5">{renderBadge(inq.status, INQUIRY_STATUS_COLORS[inq.status] ?? 'bg-gray-100 text-gray-800')}</td>
                <td className="px-2.5 py-1.5 text-gray-400 whitespace-nowrap text-xs">{formatDate(inq.createdAt)}</td>
              </tr>
            ))}
            {inquiries.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No inquiries found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  function renderForSale() {
    if (forSaleItems.length === 0 && loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      )
    }

    return (
      <div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {forSaleItems.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-1.5">
                <h3 className="font-semibold text-gray-900 text-xs leading-tight">{item.title}</h3>
                {item.isSold === 1 && (
                  <span className="shrink-0 ml-1 rounded px-1.5 py-px text-xs font-medium bg-red-100 text-red-800">Sold</span>
                )}
              </div>
              <div className="space-y-0.5 text-xs text-gray-500">
                <p>{TRAILER_TYPE_LABELS[item.trailerType] ?? item.trailerType} &middot; {[item.year, item.make, item.model].filter(Boolean).join(' ')}</p>
                {item.condition && <p>Condition: {statusLabel(item.condition)}</p>}
              </div>
              <div className="mt-2 pt-2 border-t flex items-center justify-between">
                <span className="text-sm font-bold text-brand-blue">
                  {item.price ? formatCurrency(parseFloat(item.price)) : 'Contact us'}
                </span>
                {item.isSold === 0 && (
                  <span className="rounded px-1.5 py-px text-xs font-medium bg-green-100 text-green-800">Available</span>
                )}
              </div>
            </div>
          ))}
          {forSaleItems.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400 text-xs">No items listed for sale.</div>
          )}
        </div>
      </div>
    )
  }

  function renderCustomers() {
    if (!customerSummary) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
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
      { label: 'Customers', value: customerSummary.totalCustomers, color: 'bg-gray-900 text-white' },
      { label: 'Active', value: customerSummary.activeRenters, color: 'bg-blue-50 text-blue-700' },
      { label: 'Revenue/Mo', value: formatCurrency(customerSummary.totalMonthlyRevenue), color: 'bg-green-50 text-green-700' },
      { label: 'Deposits', value: formatCurrency(customerSummary.totalDepositsHeld), color: 'bg-purple-50 text-purple-700' },
      { label: 'Pending', value: formatCurrency(customerSummary.totalPendingDeposits), color: 'bg-orange-50 text-orange-700' },
    ]

    const sortButtons: { key: typeof customerSort; label: string }[] = [
      { key: 'name', label: 'A-Z' },
      { key: 'units', label: 'Most Units' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'deposits', label: 'Deposits' },
    ]

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (customerSort) {
        case 'units':
          return b.unitsRented - a.unitsRented
        case 'revenue':
          return b.totalMonthlyRent - a.totalMonthlyRent
        case 'deposits':
          return b.totalDeposits - a.totalDeposits
        default:
          return (a.qbDisplayName ?? a.companyName).localeCompare(b.qbDisplayName ?? b.companyName)
      }
    })

    return (
      <div className="space-y-3">
        {/* Summary + Sort buttons row */}
        <div className="flex flex-wrap items-center gap-2">
          {summaryCards.map((c) => (
            <div key={c.label} className={`rounded-lg px-3 py-2 ${c.color}`}>
              <p className="text-xs font-semibold uppercase opacity-70">{c.label}</p>
              <p className="text-lg font-bold leading-tight">{c.value}</p>
            </div>
          ))}
          <div className="w-px h-8 bg-gray-200 mx-1" />
          {sortButtons.map((s) => (
            <button
              key={s.key}
              onClick={() => setCustomerSort(s.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                customerSort === s.key
                  ? 'bg-brand-orange text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search company, contact, or email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue/50 text-xs"
            />
          </div>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value as 'all' | 'active' | 'no_rentals')}
            className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
          >
            <option value="all">All Customers</option>
            <option value="active">Active Renters</option>
            <option value="no_rentals">No Current Rentals</option>
          </select>
        </div>

        <p className="text-xs text-gray-400">{sorted.length} customers</p>

        {/* Customer list */}
        <div className="space-y-1">
          {sorted.map((customer) => {
            const isExpanded = expandedCustomer === customer.id
            return (
              <div
                key={customer.id}
                className="rounded-lg border bg-white overflow-hidden"
              >
                {/* Customer header row */}
                <button
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors text-left gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0 w-7 h-7 rounded bg-brand-blue/10 flex items-center justify-center">
                      <Building2 className="h-3.5 w-3.5 text-brand-blue" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {customer.qbDisplayName ?? customer.companyName}
                        {customer.alias && <span className="text-gray-400 font-normal ml-1">({customer.alias})</span>}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {customer.contactName && <span>{customer.contactName}</span>}
                        {customer.phone && (
                          <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{customer.phone}</span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-0.5 hidden md:flex"><Mail className="h-2.5 w-2.5" />{customer.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {customer.qbBalance !== null && customer.qbBalance > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">AR Balance</p>
                        <p className="text-xs font-bold text-red-600">{formatCurrency(customer.qbBalance)}</p>
                      </div>
                    )}
                    {customer.unitsRented > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-900">{customer.unitsRented} unit{customer.unitsRented !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(customer.totalMonthlyRent)}/mo</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {customer.qbDisplayName && (
                        <span className="rounded px-1.5 py-px text-xs font-medium bg-indigo-100 text-indigo-700">QB</span>
                      )}
                      {customer.achAuthorized ? (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-px text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-2.5 w-2.5" />ACH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-px text-xs font-medium bg-gray-100 text-gray-400">
                          <XCircle className="h-2.5 w-2.5" />No ACH
                        </span>
                      )}
                      {customer.unitsRented > 0 ? (
                        <span className="rounded px-1.5 py-px text-xs font-medium bg-blue-100 text-blue-700">Active</span>
                      ) : (
                        <span className="rounded px-1.5 py-px text-xs font-medium bg-gray-100 text-gray-400">Idle</span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/80 px-3 py-3">
                    {/* Customer info — compact inline */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-3">
                      {customer.businessType && <span><span className="text-gray-400">Type:</span> <span className="text-gray-700">{customer.businessType}</span></span>}
                      {customer.stateFormed && <span><span className="text-gray-400">State:</span> <span className="text-gray-700">{customer.stateFormed}</span></span>}
                      {customer.insuranceCompany && <span><span className="text-gray-400">Insurance:</span> <span className="text-gray-700">{customer.insuranceCompany}</span></span>}
                      {customer.achBankName && <span><span className="text-gray-400">Bank:</span> <span className="text-gray-700">{customer.achBankName}</span></span>}
                      {customer.address && <span><span className="text-gray-400">Address:</span> <span className="text-gray-700">{[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</span></span>}
                      {customer.apEmail && <span><span className="text-gray-400">A/P:</span> <span className="text-gray-700">{customer.apEmail}</span></span>}
                    </div>

                    {/* Rental Journal */}
                    {customer.units.length > 0 ? (
                      <div className="overflow-x-auto rounded border bg-white">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50/80">
                              <th className="px-2 py-1 text-left font-medium text-gray-500">Unit</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-500">Type</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-500">VIN</th>
                              <th className="px-2 py-1 text-right font-medium text-gray-500">Rent/Mo</th>
                              <th className="px-2 py-1 text-right font-medium text-gray-500">Deposit</th>
                              <th className="px-2 py-1 text-right font-medium text-gray-500">Pending</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-500">Start</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-500">Due</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {customer.units.map((unit) => (
                              <tr key={unit.unitNumber} className="hover:bg-blue-50/30">
                                <td className="px-2 py-1 font-semibold text-gray-900">{unit.unitNumber}</td>
                                <td className="px-2 py-1 text-gray-500">{TRAILER_TYPE_LABELS[unit.trailerType] ?? unit.trailerType}</td>
                                <td className="px-2 py-1 text-gray-400 font-mono text-xs">{unit.vin ?? '—'}</td>
                                <td className="px-2 py-1 text-right text-gray-700 tabular-nums">{unit.rentalRate ? formatCurrency(unit.rentalRate) : '—'}</td>
                                <td className="px-2 py-1 text-right text-gray-700 tabular-nums">{unit.depositTotal ? formatCurrency(unit.depositTotal) : '—'}</td>
                                <td className="px-2 py-1 text-right tabular-nums">
                                  {unit.pendingDeposit ? <span className="text-orange-600 font-medium">{formatCurrency(unit.pendingDeposit)}</span> : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-2 py-1 text-gray-400 text-xs">{unit.rentStartDate ? formatDate(unit.rentStartDate) : '—'}</td>
                                <td className="px-2 py-1 text-gray-400 text-xs">{unit.rentDueDay ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t bg-gray-50/80 font-medium text-xs">
                              <td colSpan={3} className="px-2 py-1 text-gray-600">{customer.units.length} units</td>
                              <td className="px-2 py-1 text-right text-gray-900">{formatCurrency(customer.totalMonthlyRent)}</td>
                              <td className="px-2 py-1 text-right text-gray-900">{formatCurrency(customer.totalDeposits)}</td>
                              <td className="px-2 py-1 text-right text-orange-600">{customer.totalPendingDeposits > 0 ? formatCurrency(customer.totalPendingDeposits) : '—'}</td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No active rentals.</p>
                    )}

                    {customer.notes && (
                      <div className="mt-2 px-2 py-1.5 bg-yellow-50 rounded border border-yellow-200 text-xs">
                        <span className="font-medium text-yellow-800">Note:</span> <span className="text-yellow-700">{customer.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {sorted.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No customers match your filters.
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderInvoices() {
    if (!qbInvoiceSummary) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      )
    }

    const now = new Date()
    const filtered = qbInvoices.filter((inv) => {
      const searchLower = invoiceSearch.toLowerCase()
      const matchesSearch =
        invoiceSearch === '' ||
        inv.docNumber.toLowerCase().includes(searchLower) ||
        inv.customerName.toLowerCase().includes(searchLower)
      const isOverdue = inv.status === 'Open' && inv.dueDate && new Date(inv.dueDate) < now
      const matchesStatus =
        invoiceStatusFilter === 'all' ||
        (invoiceStatusFilter === 'Overdue' ? isOverdue : inv.status === invoiceStatusFilter)
      return matchesSearch && matchesStatus
    })

    const syncTime = qbSyncStatus.invoices?.syncedAt

    return (
      <div className="space-y-3">
        {/* Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg px-3 py-2 bg-gray-900 text-white">
            <p className="text-xs font-semibold uppercase opacity-70">Total</p>
            <p className="text-lg font-bold">{qbInvoiceSummary.totalInvoices}</p>
          </div>
          <div className="rounded-lg px-3 py-2 bg-orange-50 text-orange-700">
            <p className="text-xs font-semibold uppercase opacity-70">Open</p>
            <p className="text-lg font-bold">{qbInvoiceSummary.openCount}</p>
          </div>
          <div className="rounded-lg px-3 py-2 bg-green-50 text-green-700">
            <p className="text-xs font-semibold uppercase opacity-70">Paid</p>
            <p className="text-lg font-bold">{qbInvoiceSummary.paidCount}</p>
          </div>
          <div className="rounded-lg px-3 py-2 bg-red-50 text-red-700">
            <p className="text-xs font-semibold uppercase opacity-70">Outstanding</p>
            <p className="text-lg font-bold">{formatCurrency(qbInvoiceSummary.totalOutstanding)}</p>
          </div>
          {qbInvoiceSummary.overdueCount > 0 && (
            <div className="rounded-lg px-3 py-2 bg-red-100 text-red-800">
              <p className="text-xs font-semibold uppercase opacity-70">Overdue</p>
              <p className="text-lg font-bold">{qbInvoiceSummary.overdueCount} ({formatCurrency(qbInvoiceSummary.totalOverdue)})</p>
            </div>
          )}
          {syncTime && (
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              QB synced {formatDate(syncTime)}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoice # or customer..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue/50 text-xs"
            />
          </div>
          <select
            value={invoiceStatusFilter}
            onChange={(e) => setInvoiceStatusFilter(e.target.value as 'all' | 'Open' | 'Paid' | 'Overdue')}
            className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <p className="text-xs text-gray-400">{filtered.length} invoices</p>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {renderSortHeader("Invoice #", "docNumber")}
                {renderSortHeader("Customer", "invCustomer")}
                {renderSortHeader("Date", "txnDate")}
                {renderSortHeader("Due Date", "dueDate")}
                {renderSortHeader("Amount", "totalAmt", "right")}
                {renderSortHeader("Balance", "invBalance", "right")}
                {renderSortHeader("Status", "invStatus")}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {genericSort(filtered, (inv) => {
                switch (sortKey) {
                  case 'docNumber': return inv.docNumber
                  case 'invCustomer': return inv.customerName
                  case 'txnDate': return inv.txnDate
                  case 'dueDate': return inv.dueDate
                  case 'totalAmt': return inv.totalAmt
                  case 'invBalance': return inv.balance
                  case 'invStatus': return inv.status
                  default: return null
                }
              }).map((inv, idx) => {
                const isOverdue = inv.status === 'Open' && inv.dueDate && new Date(inv.dueDate) < now
                return (
                  <tr key={`${inv.docNumber}-${idx}`} className="hover:bg-blue-50/40">
                    <td className="px-2.5 py-1.5 font-semibold text-gray-900">#{inv.docNumber}</td>
                    <td className="px-2.5 py-1.5 text-gray-700 font-medium">{inv.customerName}</td>
                    <td className="px-2.5 py-1.5 text-gray-500">{inv.txnDate ? formatDate(inv.txnDate) : '—'}</td>
                    <td className="px-2.5 py-1.5">
                      {inv.dueDate ? (
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {formatDate(inv.dueDate)}
                          {isOverdue && <AlertCircle className="inline h-3 w-3 ml-0.5" />}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-2.5 py-1.5 text-right text-gray-700 tabular-nums">{formatCurrency(inv.totalAmt)}</td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums">
                      {inv.balance > 0 ? (
                        <span className="text-red-600 font-medium">{formatCurrency(inv.balance)}</span>
                      ) : (
                        <span className="text-gray-300">$0</span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5">
                      {isOverdue ? (
                        <span className="rounded px-1.5 py-px text-xs font-medium bg-red-100 text-red-700">Overdue</span>
                      ) : inv.status === 'Paid' ? (
                        <span className="rounded px-1.5 py-px text-xs font-medium bg-green-100 text-green-700">Paid</span>
                      ) : (
                        <span className="rounded px-1.5 py-px text-xs font-medium bg-orange-100 text-orange-700">Open</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderPayments() {
    if (!qbPaymentSummary) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      )
    }

    const filtered = qbPayments.filter((p) => {
      const searchLower = paymentSearch.toLowerCase()
      return paymentSearch === '' || p.customerName.toLowerCase().includes(searchLower)
    })

    const syncTime = qbSyncStatus.payments?.syncedAt

    return (
      <div className="space-y-3">
        {/* Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg px-3 py-2 bg-gray-900 text-white">
            <p className="text-xs font-semibold uppercase opacity-70">Total Payments</p>
            <p className="text-lg font-bold">{qbPaymentSummary.totalPayments}</p>
          </div>
          <div className="rounded-lg px-3 py-2 bg-green-50 text-green-700">
            <p className="text-xs font-semibold uppercase opacity-70">Total Collected</p>
            <p className="text-lg font-bold">{formatCurrency(qbPaymentSummary.totalCollected)}</p>
          </div>
          {syncTime && (
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              QB synced {formatDate(syncTime)}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer..."
            value={paymentSearch}
            onChange={(e) => setPaymentSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue/50 text-sm"
          />
        </div>

        <p className="text-xs text-gray-400">{filtered.length} payments</p>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {renderSortHeader("Customer", "payCustomer")}
                {renderSortHeader("Date", "payDate")}
                {renderSortHeader("Amount", "payAmt", "right")}
                {renderSortHeader("Method", "payMethod")}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {genericSort(filtered, (p) => {
                switch (sortKey) {
                  case 'payCustomer': return p.customerName
                  case 'payDate': return p.txnDate
                  case 'payAmt': return p.totalAmt
                  case 'payMethod': return p.paymentMethod
                  default: return null
                }
              }).map((p, idx) => (
                <tr key={`${p.customerName}-${idx}`} className="hover:bg-blue-50/40">
                  <td className="px-2.5 py-1.5 font-medium text-gray-900">{p.customerName}</td>
                  <td className="px-2.5 py-1.5 text-gray-500">{p.txnDate ? formatDate(p.txnDate) : '—'}</td>
                  <td className="px-2.5 py-1.5 text-right text-green-700 font-medium tabular-nums">{formatCurrency(p.totalAmt)}</td>
                  <td className="px-2.5 py-1.5 text-gray-500">{p.paymentMethod ?? '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">No payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderReports() {
    if (concentration.length === 0 && loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      )
    }

    const totalRevenue = concentration.reduce((sum, row) => sum + row.monthlyRevenue, 0)

    return (
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Customer Concentration</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/50">
              {renderSortHeader("Customer", "concCustomer")}
              {renderSortHeader("Units", "concUnits", "right")}
              {renderSortHeader("% Fleet", "concFleet", "right")}
              {renderSortHeader("Revenue/Mo", "concRevenue", "right")}
              {renderSortHeader("% Revenue", "concRevPct", "right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {genericSort(concentration, (row) => {
              switch (sortKey) {
                case 'concCustomer': return row.customer
                case 'concUnits': return row.unitCount
                case 'concFleet': return row.percentOfFleet
                case 'concRevenue': return row.monthlyRevenue
                case 'concRevPct': return totalRevenue > 0 ? row.monthlyRevenue / totalRevenue : 0
                default: return null
              }
            }).map((row) => {
              const revenuePercent = totalRevenue > 0 ? ((row.monthlyRevenue / totalRevenue) * 100).toFixed(1) : '0.0'
              return (
                <tr key={row.customer} className="hover:bg-blue-50/40">
                  <td className="px-2.5 py-1.5 font-medium text-gray-900">{row.customer}</td>
                  <td className="px-2.5 py-1.5 text-right text-gray-600">{row.unitCount}</td>
                  <td className="px-2.5 py-1.5 text-right text-gray-600">{row.percentOfFleet}%</td>
                  <td className="px-2.5 py-1.5 text-right text-gray-600">{formatCurrency(row.monthlyRevenue)}</td>
                  <td className="px-2.5 py-1.5 text-right text-gray-600">{revenuePercent}%</td>
                </tr>
              )
            })}
            {concentration.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">No concentration data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  const tabContent: Record<TabKey, () => React.JSX.Element> = {
    overview: renderOverview,
    fleet: renderFleetMaster,
    customers: renderCustomers,
    invoices: renderInvoices,
    payments: renderPayments,
    gps: renderGPS,
    inquiries: renderInquiries,
    for_sale: renderForSale,
    reports: renderReports,
  }

  const currentTabLabel =
    TABS.find((t) => t.key === activeTab)?.label ?? 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-gray-900 text-white transition-all duration-200 shrink-0 ${
          sidebarOpen ? 'w-52' : 'w-12'
        }`}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700/50">
          {sidebarOpen && (
            <div className="shrink-0 bg-white rounded p-1">
              <Image
                src="/images/logo/logo.png"
                alt="SEEK"
                width={90}
                height={28}
                className="h-5 w-auto"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
            aria-label={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-orange/90 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={tab.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{tab.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-700/50 py-2 space-y-0.5">
          <a
            href="/"
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="Back to site"
          >
            <Home className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Back to Site</span>}
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Compact header */}
        <header className="flex items-center justify-between bg-white border-b px-4 py-2 shrink-0">
          <h1 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            {currentTabLabel}
          </h1>
          <button
            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-md px-3 py-2 mb-4 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
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
