'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Lock,
  AlertCircle,
  Truck,
  DollarSign,
  FileText,
  Calendar,
  LogOut,
  Download,
} from 'lucide-react'
import { COMPANY } from '@/lib/constants'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface DashboardStats {
  totalUnitsRented: number
  totalSecurityDeposits: number
  amountOwed: number
  nextPaymentDue: { date: string; amount: number } | null
}

interface Contract {
  id: number
  unitMake: string
  unitModel: string
  unitYear: number
  unitNumber: string
  status: 'active' | 'expired'
  startDate: string
  endDate: string
  monthlyRate: number
  daysRemaining: number
  leaseAgreementUrl?: string
}

interface Invoice {
  id: number
  invoiceNumber: string
  dueDate: string
  paidDate?: string
  amount: number
  status: 'open' | 'paid'
}

interface Deposit {
  id: number
  unitNumber: string
  depositDate: string
  amount: number
  status: 'held' | 'refunded'
}

type TabKey = 'rentals' | 'invoices' | 'deposits' | 'documents'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'rentals', label: 'Active Rentals' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'deposits', label: 'Security Deposits' },
  { key: 'documents', label: 'Documents' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({
  label,
  variant,
}: {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'green'
}) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const styles: Record<string, string> = {
    default: 'bg-brand-orange/10 text-brand-orange',
    secondary: 'bg-gray-100 text-gray-600',
    outline: 'border border-gray-300 text-gray-700',
    green: 'bg-green-100 text-green-700',
  }
  return <span className={cn(base, styles[variant])}>{label}</span>
}

/* ------------------------------------------------------------------ */
/*  Login Screen                                                      */
/* ------------------------------------------------------------------ */

function LoginScreen({ onLogin }: { onLogin: (clientId: number) => void }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: code }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid credentials. Please try again.')
        return
      }

      onLogin(data.clientId)
    } catch {
      setError('Unable to connect. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <Lock className="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Portal</h1>
          <p className="text-gray-600">
            Access your rental agreements and account information
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Login</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and verification code to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="password"
                placeholder="Enter your verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have a verification code? Contact SEEK Equipment at{' '}
          <a href={COMPANY.phoneHref} className="text-brand-blue font-medium">
            {COMPANY.phone}
          </a>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Stat Cards                                                        */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  label: string
  value: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('rounded-lg p-2', iconColor)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab: Active Rentals                                               */
/* ------------------------------------------------------------------ */

function ActiveRentalsTab({ contracts }: { contracts: Contract[] }) {
  if (contracts.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No active rentals found.</p>
  }

  return (
    <div className="space-y-4">
      {contracts.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                {c.unitYear} {c.unitMake} {c.unitModel}
              </h3>
              <p className="text-sm text-gray-500">Unit #{c.unitNumber}</p>
            </div>
            <StatusBadge
              label={c.status === 'active' ? 'Active' : 'Expired'}
              variant={c.status === 'active' ? 'default' : 'secondary'}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Start</span>
              <p className="font-medium text-gray-900">{formatDate(c.startDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">End</span>
              <p className="font-medium text-gray-900">{formatDate(c.endDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">Monthly Rate</span>
              <p className="font-medium text-gray-900">{formatCurrency(c.monthlyRate)}</p>
            </div>
            <div>
              <span className="text-gray-500">Days Remaining</span>
              <p className="font-medium text-gray-900">{c.daysRemaining}</p>
            </div>
          </div>
          {c.leaseAgreementUrl && (
            <a
              href={c.leaseAgreementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-brand-blue font-medium mt-3 hover:underline"
            >
              <FileText className="h-4 w-4" />
              View Lease Agreement
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab: Invoices                                                     */
/* ------------------------------------------------------------------ */

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
  const open = invoices.filter((i) => i.status === 'open')
  const paid = invoices.filter((i) => i.status === 'paid')

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Open Invoices</h3>
        {open.length === 0 ? (
          <p className="text-gray-500 text-sm">No open invoices.</p>
        ) : (
          <div className="space-y-3">
            {open.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">Due {formatDate(inv.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                  <StatusBadge label="Open" variant="outline" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h3>
        {paid.length === 0 ? (
          <p className="text-gray-500 text-sm">No payment history.</p>
        ) : (
          <div className="space-y-3">
            {paid.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">
                    Paid {inv.paidDate ? formatDate(inv.paidDate) : formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                  <StatusBadge label="Paid" variant="green" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab: Security Deposits                                            */
/* ------------------------------------------------------------------ */

function DepositsTab({ deposits }: { deposits: Deposit[] }) {
  const total = deposits.reduce((sum, d) => sum + (d.status === 'held' ? d.amount : 0), 0)

  if (deposits.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No security deposits found.</p>
  }

  return (
    <div className="space-y-3">
      {deposits.map((d) => (
        <div key={d.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Unit Deposit &mdash; #{d.unitNumber}</p>
            <p className="text-sm text-gray-500">{formatDate(d.depositDate)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">{formatCurrency(d.amount)}</span>
            <StatusBadge
              label={d.status === 'held' ? 'Held' : 'Refunded'}
              variant={d.status === 'held' ? 'outline' : 'green'}
            />
          </div>
        </div>
      ))}
      <div className="bg-gray-50 rounded-xl border p-4 flex items-center justify-between">
        <p className="font-semibold text-gray-900">Total Security Deposits</p>
        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab: Documents                                                    */
/* ------------------------------------------------------------------ */

function DocumentsTab({ contracts }: { contracts: Contract[] }) {
  if (contracts.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No documents available.</p>
  }

  return (
    <div className="space-y-3">
      {contracts.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              {c.unitYear} {c.unitMake} {c.unitModel}
            </p>
            <p className="text-sm text-gray-500">Unit #{c.unitNumber}</p>
          </div>
          {c.leaseAgreementUrl ? (
            <a
              href={c.leaseAgreementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-blue-dark transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          ) : (
            <span className="text-sm text-gray-400">No agreement available</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

function Dashboard({ clientId, onLogout }: { clientId: number; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('rentals')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, contractsRes, invoicesRes, depositsRes] = await Promise.all([
        fetch(`/api/portal/dashboard?clientId=${clientId}`),
        fetch(`/api/portal/contracts?clientId=${clientId}`),
        fetch(`/api/portal/invoices?clientId=${clientId}`),
        fetch(`/api/portal/deposits?clientId=${clientId}`),
      ])

      const [statsData, contractsData, invoicesData, depositsData] = await Promise.all([
        statsRes.json(),
        contractsRes.json(),
        invoicesRes.json(),
        depositsRes.json(),
      ])

      if (statsData.success) setStats(statsData.data)
      if (contractsData.success) setContracts(contractsData.data)
      if (invoicesData.success) setInvoices(invoicesData.data)
      if (depositsData.success) setDeposits(depositsData.data)
    } catch {
      // Silently handle — stats/data will remain empty
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Client Portal</h1>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Truck}
                iconColor="bg-brand-orange"
                label="Total Units Rented"
                value={String(stats?.totalUnitsRented ?? 0)}
              />
              <StatCard
                icon={Lock}
                iconColor="bg-brand-blue"
                label="Total Security Deposits"
                value={formatCurrency(stats?.totalSecurityDeposits ?? 0)}
              />
              <StatCard
                icon={DollarSign}
                iconColor="bg-red-500"
                label="Amount Owed"
                value={formatCurrency(stats?.amountOwed ?? 0)}
              />
              <StatCard
                icon={Calendar}
                iconColor="bg-brand-blue"
                label="Next Payment Due"
                value={
                  stats?.nextPaymentDue
                    ? formatCurrency(stats.nextPaymentDue.amount)
                    : 'N/A'
                }
                subtitle={
                  stats?.nextPaymentDue
                    ? formatDate(stats.nextPaymentDue.date)
                    : 'No upcoming payments'
                }
              />
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.key
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'rentals' && <ActiveRentalsTab contracts={contracts} />}
            {activeTab === 'invoices' && <InvoicesTab invoices={invoices} />}
            {activeTab === 'deposits' && <DepositsTab deposits={deposits} />}
            {activeTab === 'documents' && <DocumentsTab contracts={contracts} />}
          </>
        )}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page Root                                                         */
/* ------------------------------------------------------------------ */

export default function ClientPortalPage() {
  const [clientId, setClientId] = useState<number | null>(null)

  function handleLogout() {
    setClientId(null)
  }

  if (clientId === null) {
    return <LoginScreen onLogin={setClientId} />
  }

  return <Dashboard clientId={clientId} onLogout={handleLogout} />
}
