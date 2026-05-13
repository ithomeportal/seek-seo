import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { readPortalSession } from '@/lib/portal-auth'

interface UnitRow {
  id: number
  unit_number: string
  trailer_type: string
  make: string | null
  model: string | null
  year: number | null
  vin: string | null
  status: string
  rental_rate: string | null
  deposit_total: string | null
  pending_deposit: string | null
  rent_start_date: string | null
  rent_end_date: string | null
  rent_due_day: string | null
  plate_number: string | null
  plate_expiration: string | null
}

export async function GET() {
  const session = await readPortalSession()
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Not signed in' },
      { status: 401 }
    )
  }

  if (session.customerId === null) {
    return NextResponse.json({ success: true, data: [] })
  }

  const result = await query<UnitRow>(
    `SELECT id, unit_number, trailer_type, make, model, year, vin, status,
            rental_rate, deposit_total, pending_deposit,
            rent_start_date, rent_end_date, rent_due_day,
            plate_number, plate_expiration
       FROM fleet_units
      WHERE customer_id = $1
      ORDER BY status = 'rented' DESC, unit_number ASC`,
    [session.customerId]
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const units = result.rows.map((r) => {
    const end = r.rent_end_date ? new Date(r.rent_end_date) : null
    const daysRemaining =
      end !== null && !Number.isNaN(end.getTime())
        ? Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null
    return {
      id: r.id,
      unitNumber: r.unit_number,
      trailerType: r.trailer_type,
      make: r.make,
      model: r.model,
      year: r.year,
      vin: r.vin,
      status: r.status,
      rentalRate: r.rental_rate ? parseFloat(r.rental_rate) : null,
      depositTotal: r.deposit_total ? parseFloat(r.deposit_total) : null,
      pendingDeposit: r.pending_deposit ? parseFloat(r.pending_deposit) : null,
      rentStartDate: r.rent_start_date,
      rentEndDate: r.rent_end_date,
      rentDueDay: r.rent_due_day,
      plateNumber: r.plate_number,
      plateExpiration: r.plate_expiration,
      daysRemaining,
    }
  })

  return NextResponse.json({ success: true, data: units })
}
