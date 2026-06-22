// Shared client-side types + formatters for the CRM admin tabs.
import type { ProgressState } from '@/lib/crm'

export interface CrmLead {
  id: number
  companyName: string
  contactName: string | null
  email: string | null
  phone: string | null
  region: string | null
  state: string | null
  status: string
  source: string | null
  assignedTo: string | null
  trailerInterest: string[]
  notes: string | null
  estimatedMonthlyValue: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
  // enrichment (list endpoints)
  lastActivityAt?: string | null
  lastActivityType?: string | null
  lastActivityBy?: string | null
  activityCount30d?: number
  progress?: ProgressState
}

export interface CrmDeal {
  id: number
  leadId: number
  companyName: string
  trailerType: string
  quantity: number
  monthlyRatePerUnit: number
  rentalTermMonths: number
  isMonthToMonth: boolean
  region: string | null
  state: string | null
  stage: string
  probability: number
  assignedTo: string | null
  expectedCloseDate: string | null
  closedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  notes: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  lastActivityAt?: string | null
  lastActivityType?: string | null
  lastActivityBy?: string | null
  activityCount30d?: number
  progress?: ProgressState
}

export interface CrmActivity {
  id: number
  relatedToType: 'Lead' | 'Deal'
  relatedToId: number
  activityType: string
  notes: string | null
  assignedTo: string | null
  followUpAt: string | null
  status: string
  completedAt: string | null
  createdAt: string
}

export interface CrmRep {
  id: number
  name: string
  email: string | null
  phone: string | null
  active: boolean
  createdAt: string
}

export interface AlertItem {
  id: number
  activityType: string
  notes: string | null
  assignedTo: string | null
  followUpAt: string | null
  createdAt: string
  companyName: string
  leadId: number | null
  dealId: number | null
  monthlyValue: number
  totalContract: number
  valueLabel: string
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

export async function crmFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: 'no-store', ...init })
  const json = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error ?? `Request failed (${res.status})`)
  }
  return json.data
}

export async function crmPost(path: string, body?: unknown, method = 'POST'): Promise<void> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = (await res.json()) as ApiEnvelope<unknown>
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed (${res.status})`)
  }
}
