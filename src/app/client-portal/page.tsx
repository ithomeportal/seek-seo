'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Lock,
  AlertCircle,
  Truck,
  DollarSign,
  Calendar,
  LogOut,
  Mail,
  CheckCircle2,
  ArrowLeft,
  Receipt,
  CreditCard,
} from 'lucide-react'
import { COMPANY } from '@/lib/constants'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface DashboardStats {
  activeRentals: number
  totalDepositsHeld: number
  balanceDue: number
  nextPaymentDue: { dueDate: string; amount: number; docNumber: string } | null
  hasRecord: boolean
}

interface Rental {
  id: number
  unitNumber: string
  trailerType: string
  make: string | null
  model: string | null
  year: number | null
  status: string
  rentalRate: number | null
  depositTotal: number | null
  rentStartDate: string | null
  rentEndDate: string | null
  rentDueDay: string | null
  plateNumber: string | null
  plateExpiration: string | null
  daysRemaining: number | null
}

interface Invoice {
  docNumber: string
  txnDate: string | null
  dueDate: string | null
  totalAmount: number
  balance: number
  amountPaid: number
  status: 'open' | 'paid'
}

interface Payment {
  txnDate: string | null
  amount: number
  paymentMethod: string | null
}

interface MeResponse {
  success: boolean
  email: string
  hasExistingAccount: boolean
  customer: {
    id: number
    companyName: string | null
    contactFirstName: string | null
    contactLastName: string | null
    email: string
    phone: string | null
  } | null
}

type TabKey = 'rentals' | 'invoices' | 'payments' | 'profile'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'rentals', label: 'Active Rentals' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payment History' },
  { key: 'profile', label: 'Profile' },
]

const TRAILER_TYPE_LABEL: Record<string, string> = {
  sand_chassis: 'Sand Chassis',
  belly_dump: 'Belly Dump',
  sand_hopper: 'Sand Hopper',
  dry_van: 'Dry Van',
  flatbed: 'Flat Bed',
  tank: 'Tank',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function trailerTypeLabel(value: string): string {
  return TRAILER_TYPE_LABEL[value] ?? value
}

function StatusBadge({
  label,
  variant,
}: {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'green' | 'red'
}) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const styles: Record<string, string> = {
    default: 'bg-brand-orange/10 text-brand-orange',
    secondary: 'bg-gray-100 text-gray-700',
    outline: 'border border-gray-300 text-gray-700 bg-white',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  }
  return <span className={cn(base, styles[variant])}>{label}</span>
}

/* ------------------------------------------------------------------ */
/*  Login Screen — Step 1 (email) → Step 2 (6-digit code)             */
/* ------------------------------------------------------------------ */

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function requestCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await fetch('/api/portal/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to send code. Please try again.')
        return
      }
      setStep('code')
      setInfo(data.message)
    } catch {
      setError('Unable to connect. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid code. Please try again.')
        return
      }
      onSuccess()
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
          <p className="text-gray-600">
            Access your rentals, invoices, and payment history
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-8">
          {step === 'email' ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
              <p className="text-sm text-gray-500 mb-6">
                We&apos;ll email you a 6-digit code — no password required.
              </p>

              <form onSubmit={requestCode} className="space-y-4">
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
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {loading ? 'Sending code...' : 'Email me a code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError('')
                  setInfo('')
                }}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Use a different email
              </button>

              <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter your code</h2>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-gray-700">{email}</span>. It expires
                in 10 minutes.
              </p>

              <form onSubmit={verifyCode} className="space-y-4">
                {info && !error && (
                  <div className="flex items-start gap-2 bg-green-50 text-green-700 rounded-lg p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{info}</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    6-digit code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoComplete="one-time-code"
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {loading ? 'Verifying...' : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Contact SEEK Equipment at{' '}
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

function RentalsTab({ rentals }: { rentals: Rental[] }) {
  const active = rentals.filter((r) => r.status === 'rented')
  const past = rentals.filter((r) => r.status !== 'rented')

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Active Rentals ({active.length})
        </h3>
        {active.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No active rentals.</p>
        ) : (
          <div className="space-y-4">
            {active.map((r) => (
              <RentalCard key={r.id} rental={r} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Past Rentals ({past.length})
          </h3>
          <div className="space-y-4">
            {past.map((r) => (
              <RentalCard key={r.id} rental={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function RentalCard({ rental: r }: { rental: Rental }) {
  const isActive = r.status === 'rented'
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {trailerTypeLabel(r.trailerType)}
            {r.year && r.make ? ` — ${r.year} ${r.make}` : ''}
          </h3>
          <p className="text-sm text-gray-500">Unit #{r.unitNumber}</p>
        </div>
        <StatusBadge
          label={isActive ? 'Active' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
          variant={isActive ? 'default' : 'secondary'}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Start</span>
          <p className="font-medium text-gray-900">{formatDate(r.rentStartDate)}</p>
        </div>
        <div>
          <span className="text-gray-500">End</span>
          <p className="font-medium text-gray-900">{formatDate(r.rentEndDate)}</p>
        </div>
        <div>
          <span className="text-gray-500">Monthly Rate</span>
          <p className="font-medium text-gray-900">
            {r.rentalRate !== null ? formatCurrency(r.rentalRate) : '—'}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Days Remaining</span>
          <p className="font-medium text-gray-900">
            {r.daysRemaining !== null ? (r.daysRemaining < 0 ? 'Ended' : r.daysRemaining) : '—'}
          </p>
        </div>
      </div>
      {(r.plateNumber || r.depositTotal) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-3 pt-3 border-t">
          {r.plateNumber && (
            <div>
              <span className="text-gray-500">Plate</span>
              <p className="font-medium text-gray-900">{r.plateNumber}</p>
            </div>
          )}
          {r.plateExpiration && (
            <div>
              <span className="text-gray-500">Plate Exp.</span>
              <p className="font-medium text-gray-900">{formatDate(r.plateExpiration)}</p>
            </div>
          )}
          {r.depositTotal !== null && r.depositTotal > 0 && (
            <div>
              <span className="text-gray-500">Deposit</span>
              <p className="font-medium text-gray-900">{formatCurrency(r.depositTotal)}</p>
            </div>
          )}
          {r.rentDueDay && (
            <div>
              <span className="text-gray-500">Rent Due Day</span>
              <p className="font-medium text-gray-900">{r.rentDueDay}</p>
            </div>
          )}
        </div>
      )}
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
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Open Invoices ({open.length})
        </h3>
        {open.length === 0 ? (
          <p className="text-gray-500 text-sm">No open invoices.</p>
        ) : (
          <div className="space-y-3">
            {open.map((inv) => (
              <InvoiceRow key={inv.docNumber} invoice={inv} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Paid Invoices</h3>
        {paid.length === 0 ? (
          <p className="text-gray-500 text-sm">No paid invoices yet.</p>
        ) : (
          <div className="space-y-3">
            {paid.map((inv) => (
              <InvoiceRow key={inv.docNumber} invoice={inv} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function InvoiceRow({ invoice: inv }: { invoice: Invoice }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">Invoice #{inv.docNumber || '—'}</p>
        <p className="text-sm text-gray-500">
          {inv.status === 'paid'
            ? `Dated ${formatDate(inv.txnDate)}`
            : `Due ${formatDate(inv.dueDate)}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold text-gray-900">{formatCurrency(inv.totalAmount)}</p>
          {inv.status === 'open' && inv.balance < inv.totalAmount && (
            <p className="text-xs text-gray-500">
              {formatCurrency(inv.balance)} remaining
            </p>
          )}
        </div>
        <StatusBadge
          label={inv.status === 'paid' ? 'Paid' : 'Open'}
          variant={inv.status === 'paid' ? 'green' : 'outline'}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab: Payments                                                     */
/* ------------------------------------------------------------------ */

function PaymentsTab({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No payments on record.</p>
  }
  const total = payments.reduce((sum, p) => sum + p.amount, 0)
  return (
    <div className="space-y-3">
      {payments.map((p, idx) => (
        <div
          key={`${p.txnDate}-${idx}`}
          className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-gray-900">{formatDate(p.txnDate)}</p>
            {p.paymentMethod && (
              <p className="text-sm text-gray-500">{p.paymentMethod}</p>
            )}
          </div>
          <span className="font-semibold text-gray-900">{formatCurrency(p.amount)}</span>
        </div>
      ))}
      <div className="bg-gray-50 rounded-xl border p-4 flex items-center justify-between">
        <p className="font-semibold text-gray-900">Total Payments</p>
        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab: Profile                                                      */
/* ------------------------------------------------------------------ */

function ProfileTab({ me }: { me: MeResponse }) {
  const c = me.customer
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-3 text-sm">
      <ProfileRow label="Email" value={me.email} />
      {c ? (
        <>
          <ProfileRow label="Company" value={c.companyName ?? '—'} />
          <ProfileRow
            label="Contact"
            value={
              [c.contactFirstName, c.contactLastName].filter(Boolean).join(' ') || '—'
            }
          />
          <ProfileRow label="Phone" value={c.phone ?? '—'} />
        </>
      ) : (
        <p className="text-gray-500 text-sm">
          No rental record is linked to this email yet. Contact SEEK Equipment at{' '}
          <a href={COMPANY.phoneHref} className="text-brand-blue font-medium">
            {COMPANY.phone}
          </a>{' '}
          to associate your account.
        </p>
      )}
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

function Dashboard({ me, onLogout }: { me: MeResponse; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('rentals')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, rentalsRes, invoicesRes, paymentsRes] = await Promise.all([
        fetch('/api/portal/dashboard'),
        fetch('/api/portal/contracts'),
        fetch('/api/portal/invoices'),
        fetch('/api/portal/payments'),
      ])
      const [statsData, rentalsData, invoicesData, paymentsData] = await Promise.all([
        statsRes.json(),
        rentalsRes.json(),
        invoicesRes.json(),
        paymentsRes.json(),
      ])
      if (statsData.success) setStats(statsData.data)
      if (rentalsData.success) setRentals(rentalsData.data)
      if (invoicesData.success) setInvoices(invoicesData.data)
      if (paymentsData.success) setPayments(paymentsData.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {me.customer?.companyName || 'Customer Portal'}
            </h1>
            <p className="text-xs text-gray-500 truncate">{me.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!me.hasExistingAccount && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
            <p className="font-semibold mb-1">Welcome to the SEEK Customer Portal</p>
            <p>
              We don&apos;t have a rental record linked to this email yet. Once SEEK
              links your account, your rentals, invoices, and payment history will
              appear here automatically. Contact us at{' '}
              <a href={COMPANY.phoneHref} className="font-medium underline">
                {COMPANY.phone}
              </a>{' '}
              to get started.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Truck}
                iconColor="bg-brand-orange"
                label="Active Rentals"
                value={String(stats?.activeRentals ?? 0)}
              />
              <StatCard
                icon={Lock}
                iconColor="bg-brand-blue"
                label="Deposits Held"
                value={formatCurrency(stats?.totalDepositsHeld ?? 0)}
              />
              <StatCard
                icon={DollarSign}
                iconColor={
                  (stats?.balanceDue ?? 0) > 0 ? 'bg-red-500' : 'bg-green-500'
                }
                label="Balance Due"
                value={formatCurrency(stats?.balanceDue ?? 0)}
              />
              <StatCard
                icon={Calendar}
                iconColor="bg-brand-blue"
                label="Next Payment Due"
                value={
                  stats?.nextPaymentDue
                    ? formatCurrency(stats.nextPaymentDue.amount)
                    : '—'
                }
                subtitle={
                  stats?.nextPaymentDue
                    ? formatDate(stats.nextPaymentDue.dueDate)
                    : 'No upcoming payments'
                }
              />
            </div>

            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5',
                    activeTab === tab.key
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {tab.key === 'rentals' && <Truck className="h-4 w-4" />}
                  {tab.key === 'invoices' && <Receipt className="h-4 w-4" />}
                  {tab.key === 'payments' && <CreditCard className="h-4 w-4" />}
                  {tab.key === 'profile' && <Mail className="h-4 w-4" />}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'rentals' && <RentalsTab rentals={rentals} />}
            {activeTab === 'invoices' && <InvoicesTab invoices={invoices} />}
            {activeTab === 'payments' && <PaymentsTab payments={payments} />}
            {activeTab === 'profile' && <ProfileTab me={me} />}
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
  const [me, setMe] = useState<MeResponse | null>(null)
  const [checked, setChecked] = useState(false)

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/me', { cache: 'no-store' })
      if (!res.ok) {
        setMe(null)
        return
      }
      const data = (await res.json()) as MeResponse
      setMe(data.success ? data : null)
    } catch {
      setMe(null)
    } finally {
      setChecked(true)
    }
  }, [])

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  async function handleLogout() {
    try {
      await fetch('/api/portal/logout', { method: 'POST' })
    } finally {
      setMe(null)
    }
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    )
  }

  if (!me) {
    return <LoginScreen onSuccess={refreshMe} />
  }

  return <Dashboard me={me} onLogout={handleLogout} />
}
