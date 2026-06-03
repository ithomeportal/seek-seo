import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  CRM_TRAILER_TYPES,
  DEAL_STAGES,
  DEFAULT_MONTHLY_RATE_BY_TYPE,
  LEAD_STATUSES,
  STAGE_PROBABILITY,
  monthlyDealRevenue,
  totalContractValue,
  type CrmTrailerType,
} from '@/lib/crm'
import { listDeals, listLeads } from '@/lib/crm-db'

interface FleetRow {
  id: number
  trailer_type: string
  status: string
  rental_rate: string | number | null
  rent_start_date: Date | string | null
  rent_end_date: Date | string | null
  updated_at: Date | string | null
}

const DAYS_PER_MONTH = 30.4375

function toDate(v: Date | string | null): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// CRM analytics dashboard. Deal/lead KPIs come from the crm_* tables; fleet KPIs
// are computed from the real fleet_units table (source of truth, read-only here).
// Sold units are excluded everywhere, per site convention. Idle/velocity numbers
// are approximations from rent_start_date / rent_end_date (no rental-history table).
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const idleFrom = url.searchParams.get('idleFrom')
    const idleTo = url.searchParams.get('idleTo')

    const [allDeals, allLeads, fleetResult] = await Promise.all([
      listDeals({}),
      listLeads({}),
      query<FleetRow>(
        `SELECT id, trailer_type, status, rental_rate, rent_start_date, rent_end_date, updated_at
         FROM fleet_units
         WHERE status != 'sold'`
      ),
    ])
    const fleet = fleetResult.rows

    // ===== Deal KPIs =====
    const openDeals = allDeals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
    const wonDeals = allDeals.filter((d) => d.stage === 'Closed Won')
    const lostDeals = allDeals.filter((d) => d.stage === 'Closed Lost')
    const pipelineMonthly = openDeals.reduce(
      (s, d) => s + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit),
      0
    )
    const weightedMonthly = openDeals.reduce(
      (s, d) => s + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit) * (d.probability / 100),
      0
    )
    const wonContractValue = wonDeals.reduce(
      (s, d) => s + totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth),
      0
    )
    const closedTotal = wonDeals.length + lostDeals.length
    const winRate = closedTotal ? (wonDeals.length / closedTotal) * 100 : 0

    const dealsByStage = DEAL_STAGES.map((stage) => ({
      stage,
      probability: STAGE_PROBABILITY[stage] ?? 0,
      count: allDeals.filter((d) => d.stage === stage).length,
    }))

    // ===== Fleet KPIs (from fleet_units, sold excluded) =====
    const total = fleet.length
    const available = fleet.filter((f) => f.status === 'available')
    const rented = fleet.filter((f) => f.status === 'rented')
    const maintenanceLike = fleet.filter((f) => ['maintenance', 'make_ready'].includes(f.status))
    const utilization = total ? (rented.length / total) * 100 : 0
    const today = new Date()

    // Average monthly rate per type: active/won deal rates → actual rented rates → defaults.
    const avgRateByType: Record<string, number> = {}
    for (const t of CRM_TRAILER_TYPES) {
      const dealRates = allDeals
        .filter((d) => d.trailerType === t && ['Closed Won', 'Negotiation', 'Proposal'].includes(d.stage))
        .map((d) => d.monthlyRatePerUnit)
        .filter((n) => n > 0)
      if (dealRates.length) {
        avgRateByType[t] = dealRates.reduce((a, b) => a + b, 0) / dealRates.length
        continue
      }
      const fleetRates = rented
        .filter((f) => f.trailer_type === t)
        .map((f) => Number(f.rental_rate ?? 0))
        .filter((n) => n > 0)
      avgRateByType[t] = fleetRates.length
        ? fleetRates.reduce((a, b) => a + b, 0) / fleetRates.length
        : DEFAULT_MONTHLY_RATE_BY_TYPE[t as CrmTrailerType] ?? 0
    }

    // Idle data: a unit is idle since its last rental ended (fallback: last update).
    const idleData = available.map((f) => {
      const since = toDate(f.rent_end_date) ?? toDate(f.updated_at) ?? today
      const days = Math.max(0, Math.floor((today.getTime() - since.getTime()) / 86400000))
      const dailyLoss = (avgRateByType[f.trailer_type] ?? 0) / DAYS_PER_MONTH
      return { trailerType: f.trailer_type, days, lost: days * dailyLoss, dailyLoss }
    })
    const idleRevenueLost = idleData.reduce((s, x) => s + x.lost, 0)
    const cumulativeIdleDays = idleData.reduce((s, x) => s + x.days, 0)

    // Range-bound idle loss (default YTD), over all non-revenue units.
    const yearStart = new Date(today.getFullYear(), 0, 1)
    const fromDate = idleFrom ? new Date(`${idleFrom}T00:00:00`) : yearStart
    const toDateBound = idleTo ? new Date(`${idleTo}T23:59:59`) : today
    const rangeFromMs = fromDate.getTime()
    const rangeToMs = Math.min(toDateBound.getTime(), today.getTime())
    const nonRevenue = fleet.filter((f) =>
      ['available', 'maintenance', 'make_ready'].includes(f.status)
    )
    const rangeIdleData = nonRevenue.map((f) => {
      const since = (toDate(f.rent_end_date) ?? toDate(f.updated_at) ?? today).getTime()
      const start = Math.max(since, rangeFromMs)
      const days = rangeToMs > start ? Math.floor((rangeToMs - start) / 86400000) : 0
      const dailyLoss = (avgRateByType[f.trailer_type] ?? 0) / DAYS_PER_MONTH
      return { trailerType: f.trailer_type, days, lost: days * dailyLoss }
    })
    const idleLossInRange = rangeIdleData.reduce((s, x) => s + x.lost, 0)
    const idleLossByType = CRM_TRAILER_TYPES.map((t) => {
      const list = rangeIdleData.filter((x) => x.trailerType === t)
      return {
        trailerType: t,
        units: list.length,
        days: list.reduce((s, x) => s + x.days, 0),
        lost: list.reduce((s, x) => s + x.lost, 0),
      }
    })

    // Lost monthly revenue: every non-revenue unit × avg monthly rate for its type.
    const lostMonthlyByType = CRM_TRAILER_TYPES.map((t) => {
      const units = nonRevenue.filter((f) => f.trailer_type === t)
      const av = units.filter((f) => f.status === 'available').length
      const mt = units.length - av
      const rate = avgRateByType[t] ?? 0
      return {
        trailerType: t,
        units: units.length,
        available: av,
        maintenance: mt,
        avgMonthlyRate: rate,
        lostMonthly: units.length * rate,
      }
    })
    const lostMonthlyTotal = lostMonthlyByType.reduce((s, x) => s + x.lostMonthly, 0)

    // Per-type fleet stats
    const fleetByType = CRM_TRAILER_TYPES.map((t) => {
      const list = fleet.filter((f) => f.trailer_type === t)
      const av = list.filter((f) => f.status === 'available').length
      const rt = list.filter((f) => f.status === 'rented').length
      const mt = list.filter((f) => ['maintenance', 'make_ready'].includes(f.status)).length
      const idleList = idleData.filter((x) => x.trailerType === t)
      const avgIdle = idleList.length ? idleList.reduce((s, x) => s + x.days, 0) / idleList.length : 0
      const maxIdle = idleList.length ? Math.max(...idleList.map((x) => x.days)) : 0
      return {
        trailerType: t,
        total: list.length,
        available: av,
        rented: rt,
        maintenance: mt,
        utilization: list.length ? (rt / list.length) * 100 : 0,
        avgIdleDays: avgIdle,
        maxIdleDays: maxIdle,
        revenueLost: idleList.reduce((s, x) => s + x.lost, 0),
      }
    })

    // Velocity (approximation): rentals started = currently-rented units whose
    // rent_start_date falls inside the trailing window. No rental-history table.
    const velocityMonths = 6
    const velocitySince = new Date(today)
    velocitySince.setMonth(velocitySince.getMonth() - velocityMonths)
    const startedRecently = rented.filter((f) => {
      const d = toDate(f.rent_start_date)
      return d !== null && d >= velocitySince
    })
    const avgRentalsPerMonth = startedRecently.length / velocityMonths
    const monthsToLeaseAll = avgRentalsPerMonth > 0 ? available.length / avgRentalsPerMonth : null
    const velocityByType = CRM_TRAILER_TYPES.map((t) => {
      const startedT = startedRecently.filter((f) => f.trailer_type === t).length
      const avPerMonth = startedT / velocityMonths
      const av = available.filter((f) => f.trailer_type === t).length
      return {
        trailerType: t,
        rentedInPeriod: startedT,
        avgPerMonth: avPerMonth,
        available: av,
        monthsToLeaseAll: avPerMonth > 0 ? av / avPerMonth : null,
      }
    })

    // ===== Pipeline breakdowns =====
    const byStage = DEAL_STAGES.map((s) => {
      const list = allDeals.filter((d) => d.stage === s)
      return {
        stage: s,
        count: list.length,
        monthlyRevenue: list.reduce((sum, d) => sum + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit), 0),
      }
    })
    const regions = Array.from(new Set(allDeals.map((d) => d.region).filter(Boolean))) as string[]
    const byRegion = regions
      .map((r) => {
        const list = allDeals.filter((d) => d.region === r)
        return {
          region: r,
          count: list.length,
          monthlyRevenue: list.reduce((sum, d) => sum + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit), 0),
        }
      })
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    const byTrailerType = CRM_TRAILER_TYPES.map((t) => {
      const list = allDeals.filter((d) => d.trailerType === t)
      return {
        trailerType: t,
        count: list.length,
        units: list.reduce((s, d) => s + d.quantity, 0),
        monthlyRevenue: list.reduce((sum, d) => sum + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit), 0),
      }
    })

    // ===== Lead funnel =====
    const leadFunnel = LEAD_STATUSES.map((s) => ({
      status: s,
      count: allLeads.filter((l) => l.status === s).length,
    }))
    const totalLeads = allLeads.length
    const qualifiedPlus = allLeads.filter((l) =>
      ['Qualified', 'Proposal Sent', 'Won'].includes(l.status)
    ).length
    const wonCount = allLeads.filter((l) => l.status === 'Won').length
    const leadToQualified = totalLeads ? (qualifiedPlus / totalLeads) * 100 : 0
    const leadToWon = totalLeads ? (wonCount / totalLeads) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          openDeals: openDeals.length,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          pipelineMonthly,
          weightedMonthly,
          wonContractValue,
          winRate,
          totalTrailers: total,
          available: available.length,
          rented: rented.length,
          maintenance: maintenanceLike.length,
          utilization,
          idleRevenueLost,
          cumulativeIdleDays,
          idleLossInRange,
          idleRangeFrom: fromDate.toISOString().slice(0, 10),
          idleRangeTo: new Date(rangeToMs).toISOString().slice(0, 10),
          avgRentalsPerMonth,
          monthsToLeaseAll,
          totalLeads,
          lostMonthlyTotal,
        },
        lostMonthlyByType,
        idleLossByType,
        fleetByType,
        velocity: {
          months: velocityMonths,
          totalRecent: startedRecently.length,
          avgPerMonth: avgRentalsPerMonth,
          monthsToLeaseAll,
          byType: velocityByType,
        },
        pipeline: { byStage, byRegion, byTrailerType, leadFunnel, leadToQualified, leadToWon },
        dealsByStage,
      },
    })
  } catch (error) {
    console.error('CRM analytics dashboard error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load analytics' }, { status: 500 })
  }
}
