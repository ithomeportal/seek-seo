import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

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
          'rentDueDay', rent_due_day,
          'vin', vin
        ) ORDER BY unit_number)::text AS unit_details
      FROM fleet_units
      WHERE customer_id IS NULL AND rented_to IS NOT NULL AND status = 'rented'
      GROUP BY rented_to`
    )

    const customers = customersResult.rows.map((row) => {
      const rental = rentalMap.get(row.id)
      return {
        id: row.id,
        companyName: row.company_name,
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

    return NextResponse.json({
      success: true,
      data: {
        customers,
        summary: {
          totalCustomers,
          activeRenters,
          totalMonthlyRevenue,
          totalDepositsHeld,
          totalPendingDeposits,
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
