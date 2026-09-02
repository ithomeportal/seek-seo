import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { qbQuery } from '@/lib/qb-db'
import {
  rowToApplication,
  sectionProgress,
  type OnboardingApplicationRow,
} from '@/lib/onboarding'

/**
 * A company partway through onboarding, surfaced in the Customers list.
 *
 * `customers` and `customer_onboarding_applications` are entirely disjoint —
 * nothing links them, and `customer_id` is NULL on every onboarding row — so a
 * company signing up was invisible here until it was hand-entered as a
 * customer. These records are returned alongside the real customers, clearly
 * marked, rather than merged into them: an onboarding company has no units, no
 * rent and no deposits, and inventing zeroed customer rows for them would
 * quietly corrupt the revenue and deposit totals above the table.
 */
interface OnboardingCompany {
  id: number
  reference: string
  companyName: string
  contactName: string | null
  phone: string | null
  email: string
  status: string
  startedAt: string
  completedAt: string | null
  progress: { completed: number; total: number; isComplete: boolean }
  /** Set when this company already exists in `customers`, matched below. */
  matchedCustomerId: number | null
}

/** Loose key for matching an onboarding record to an existing customer. */
function nameKey(value: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\b(llc|inc|l\.l\.c|corp|corporation|co|ltd)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

interface CustomerRow {
  id: number
  company_name: string
  contact_first_name: string | null
  contact_last_name: string | null
  phone: string | null
  email: string | null
  business_type: string | null
  state_formed: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  insurance_company: string | null
  ach_authorized: boolean
  ach_bank_name: string | null
  ap_email: string | null
  ap_phone: string | null
  status: string
  notes: string | null
  alias: string | null
  qb_display_name: string | null
  created_at: string
  updated_at: string
}

interface RentalRow {
  customer_id: number
  units_rented: string
  total_monthly_rent: string
  total_deposits: string
  total_pending_deposits: string
  unit_details: string
}

export async function GET() {
  try {
    const customersResult = await query<CustomerRow>(
      'SELECT * FROM customers ORDER BY company_name ASC'
    )

    const rentalsResult = await query<RentalRow>(
      `SELECT
        customer_id,
        COUNT(*)::text AS units_rented,
        COALESCE(SUM(rental_rate), 0)::text AS total_monthly_rent,
        COALESCE(SUM(deposit_total), 0)::text AS total_deposits,
        COALESCE(SUM(pending_deposit), 0)::text AS total_pending_deposits,
        json_agg(json_build_object(
          'unitNumber', unit_number,
          'trailerType', trailer_type,
          'status', status,
          'rentalRate', rental_rate,
          'depositTotal', deposit_total,
          'pendingDeposit', pending_deposit,
          'rentStartDate', rent_start_date,
          'rentEndDate', rent_end_date,
          'rentDueDay', rent_due_day,
          'vin', vin
        ) ORDER BY unit_number)::text AS unit_details
      FROM fleet_units
      WHERE customer_id IS NOT NULL
      GROUP BY customer_id`
    )

    const rentalMap = new Map<number, {
      unitsRented: number
      totalMonthlyRent: number
      totalDeposits: number
      totalPendingDeposits: number
      units: Array<{
        unitNumber: string
        trailerType: string
        status: string
        rentalRate: number | null
        depositTotal: number | null
        pendingDeposit: number | null
        rentStartDate: string | null
        rentEndDate: string | null
        rentDueDay: string | null
        vin: string | null
      }>
    }>()

    for (const row of rentalsResult.rows) {
      rentalMap.set(row.customer_id, {
        unitsRented: parseInt(row.units_rented, 10),
        totalMonthlyRent: parseFloat(row.total_monthly_rent),
        totalDeposits: parseFloat(row.total_deposits),
        totalPendingDeposits: parseFloat(row.total_pending_deposits),
        units: JSON.parse(row.unit_details),
      })
    }

    // Also get units linked by rented_to name (for units without customer_id)
    const nameRentalsResult = await query<RentalRow>(
      `SELECT
        rented_to AS customer_name,
        COUNT(*)::text AS units_rented,
        COALESCE(SUM(rental_rate), 0)::text AS total_monthly_rent,
        COALESCE(SUM(deposit_total), 0)::text AS total_deposits,
        COALESCE(SUM(pending_deposit), 0)::text AS total_pending_deposits,
        json_agg(json_build_object(
          'unitNumber', unit_number,
          'trailerType', trailer_type,
          'status', status,
          'rentalRate', rental_rate,
          'depositTotal', deposit_total,
          'pendingDeposit', pending_deposit,
          'rentStartDate', rent_start_date,
          'rentEndDate', rent_end_date,
          'rentDueDay', rent_due_day,
          'vin', vin
        ) ORDER BY unit_number)::text AS unit_details
      FROM fleet_units
      WHERE customer_id IS NULL AND rented_to IS NOT NULL AND status = 'rented'
      GROUP BY rented_to`
    )

    // Fetch QB balances for linked customers
    const qbBalanceMap = new Map<string, number>()
    try {
      const qbResult = await qbQuery(
        `SELECT display_name, balance FROM qb_customers WHERE active = true`
      )
      for (const r of qbResult.rows) {
        qbBalanceMap.set(
          (r.display_name as string).toLowerCase(),
          parseFloat(String(r.balance ?? '0'))
        )
      }
    } catch {
      // QB database may be unavailable — continue without it
    }

    const customers = customersResult.rows.map((row) => {
      const rental = rentalMap.get(row.id)
      const qbName = row.qb_display_name as string | null
      const qbBalance = qbName ? (qbBalanceMap.get(qbName.toLowerCase()) ?? null) : null
      return {
        id: row.id,
        companyName: row.company_name,
        alias: row.alias as string | null,
        qbDisplayName: qbName,
        qbBalance,
        contactName: [row.contact_first_name, row.contact_last_name]
          .filter(Boolean)
          .join(' ') || null,
        phone: row.phone,
        email: row.email,
        businessType: row.business_type,
        stateFormed: row.state_formed,
        address: row.address,
        city: row.city,
        state: row.state,
        zip: row.zip,
        insuranceCompany: row.insurance_company,
        achAuthorized: row.ach_authorized,
        achBankName: row.ach_bank_name,
        apEmail: row.ap_email,
        apPhone: row.ap_phone,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        unitsRented: rental?.unitsRented ?? 0,
        totalMonthlyRent: rental?.totalMonthlyRent ?? 0,
        totalDeposits: rental?.totalDeposits ?? 0,
        totalPendingDeposits: rental?.totalPendingDeposits ?? 0,
        units: rental?.units ?? [],
      }
    })

    // ---- Companies in onboarding -------------------------------------
    // Archived rows are excluded: archiving is how an admin removes a test or
    // mistaken submission, and it must disappear from every list at once.
    const onboardingResult = await query<OnboardingApplicationRow>(
      `SELECT * FROM customer_onboarding_applications
        WHERE archived_at IS NULL
        ORDER BY created_at DESC
        LIMIT 500`
    )

    const customersByEmail = new Map<string, number>()
    const customersByName = new Map<string, number>()
    for (const c of customers) {
      if (c.email) customersByEmail.set(c.email.toLowerCase().trim(), c.id)
      const key = nameKey(c.companyName)
      if (key !== '') customersByName.set(key, c.id)
      const aliasKey = nameKey(c.alias)
      if (aliasKey !== '') customersByName.set(aliasKey, c.id)
    }

    const onboarding: OnboardingCompany[] = onboardingResult.rows.map((row) => {
      const app = rowToApplication(row)
      const progress = sectionProgress(app)
      const emailKey = app.email.toLowerCase().trim()
      const matchedCustomerId =
        customersByEmail.get(emailKey) ??
        customersByName.get(nameKey(app.companyName)) ??
        null

      return {
        id: app.id,
        reference: app.reference,
        companyName: app.companyName ?? app.email,
        contactName:
          [app.contactFirstName, app.contactLastName].filter(Boolean).join(' ') || null,
        phone: app.phone,
        email: app.email,
        status: app.status,
        startedAt: app.createdAt,
        completedAt: app.completedAt,
        progress: {
          completed: progress.completed,
          total: progress.total,
          isComplete: progress.isComplete,
        },
        matchedCustomerId,
      }
    })

    // Summary stats
    const totalCustomers = customers.length
    const activeRenters = customers.filter((c) => c.unitsRented > 0).length
    const totalMonthlyRevenue = customers.reduce(
      (sum, c) => sum + c.totalMonthlyRent,
      0
    )
    const totalDepositsHeld = customers.reduce(
      (sum, c) => sum + c.totalDeposits,
      0
    )
    const totalPendingDeposits = customers.reduce(
      (sum, c) => sum + c.totalPendingDeposits,
      0
    )

    // Counted from the CHECKLIST, not from `status`. The two disagree in real
    // data — GNS Services is marked status='completed' while its document
    // checklist sits at 2/3, a row finished before the voided-check requirement
    // existed — and the KPI card must match the rows listed beneath it.
    const onboardingInProgress = onboarding.filter(
      (o) => !o.progress.isComplete
    ).length

    return NextResponse.json({
      success: true,
      data: {
        customers,
        onboarding,
        summary: {
          totalCustomers,
          activeRenters,
          totalMonthlyRevenue,
          totalDepositsHeld,
          totalPendingDeposits,
          // Deliberately NOT folded into totalCustomers — an onboarding company
          // is not yet a customer, and the revenue/deposit cards beside it are
          // computed from real rentals only.
          onboardingTotal: onboarding.length,
          onboardingInProgress,
        },
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Failed to fetch customers: ${message}` },
      { status: 500 }
    )
  }
}
