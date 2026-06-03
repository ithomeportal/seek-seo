import { NextResponse } from 'next/server'
import { classifyProgress, monthlyDealRevenue, totalContractValue } from '@/lib/crm'
import { listActivities, listDeals, listLeads, type CrmActivity } from '@/lib/crm-db'

// One endpoint for the Reports tab: sales-rep performance, pipeline health,
// and cancelled/lost deals (ports of the MANUS analytics procedures).
export async function GET() {
  try {
    const [allLeads, allDeals, allDealsWithArchived, allActs] = await Promise.all([
      listLeads({}),
      listDeals({}),
      listDeals({ includeArchived: true }),
      listActivities({}),
    ])
    const now = new Date()

    // ===== Sales rep performance =====
    const repsSet = new Set<string>()
    allLeads.forEach((l) => l.assignedTo && repsSet.add(l.assignedTo))
    allDeals.forEach((d) => d.assignedTo && repsSet.add(d.assignedTo))
    const repPerformance = Array.from(repsSet)
      .sort()
      .map((rep) => {
        const myLeads = allLeads.filter((l) => l.assignedTo === rep)
        const myDeals = allDeals.filter((d) => d.assignedTo === rep)
        const open = myDeals.filter((d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
        const won = myDeals.filter((d) => d.stage === 'Closed Won')
        const lost = myDeals.filter((d) => d.stage === 'Closed Lost')
        const closedTotal = won.length + lost.length
        const myActs = allActs.filter((a) => a.assignedTo === rep)
        const pending = myActs.filter((a) => a.status === 'Pending' && a.followUpAt)
        const overdue = pending.filter(
          (a) => a.followUpAt && new Date(a.followUpAt).getTime() < now.getTime()
        )
        return {
          rep,
          leads: myLeads.length,
          openDeals: open.length,
          wonDeals: won.length,
          lostDeals: lost.length,
          winRate: closedTotal ? (won.length / closedTotal) * 100 : 0,
          openPipeline: open.reduce((s, d) => s + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit), 0),
          weightedPipeline: open.reduce(
            (s, d) => s + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit) * (d.probability / 100),
            0
          ),
          wonContractValue: won.reduce(
            (s, d) => s + totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth),
            0
          ),
          activities: myActs.length,
          pending: pending.length,
          overdue: overdue.length,
        }
      })

    // ===== Pipeline health by owner (progress-state tally) =====
    const actsByTarget = new Map<string, CrmActivity[]>()
    for (const a of allActs) {
      const key = `${a.relatedToType}:${a.relatedToId}`
      const list = actsByTarget.get(key) ?? []
      actsByTarget.set(key, [...list, a])
    }
    const tallyFor = (kind: 'Lead' | 'Deal', id: number): string => {
      const ownedActs = actsByTarget.get(`${kind}:${id}`) ?? []
      const last = ownedActs.length
        ? new Date(Math.max(...ownedActs.map((a) => new Date(a.completedAt ?? a.createdAt).getTime())))
        : null
      const count30d = ownedActs.filter((a) => {
        const t = a.completedAt ?? a.createdAt
        return t && now.getTime() - new Date(t).getTime() <= 30 * 86400000
      }).length
      return classifyProgress({ lastActivityAt: last, activityCount30d: count30d, now })
    }
    const pipelineHealth = Array.from(repsSet)
      .sort()
      .map((rep) => {
        const myLeads = allLeads.filter((l) => l.assignedTo === rep)
        const myOpenDeals = allDeals.filter(
          (d) => d.assignedTo === rep && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
        )
        const tally: Record<string, number> = {
          Advancing: 0,
          Steady: 0,
          Stalling: 0,
          Cold: 0,
          'No Activity': 0,
        }
        myLeads.forEach((l) => {
          tally[tallyFor('Lead', l.id)] += 1
        })
        myOpenDeals.forEach((d) => {
          tally[tallyFor('Deal', d.id)] += 1
        })
        const totalCount = Object.values(tally).reduce((s, n) => s + n, 0)
        return { rep, total: totalCount, ...tally }
      })

    // ===== Cancelled / lost deals (Closed Lost are auto-archived → include archived) =====
    const lostAll = allDealsWithArchived.filter((d) => d.stage === 'Closed Lost')
    const totalLostMRR = lostAll.reduce((s, d) => s + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit), 0)
    const totalLostTCV = lostAll.reduce(
      (s, d) => s + totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth),
      0
    )
    interface LostByLead {
      leadId: number
      companyName: string
      count: number
      lostMRR: number
      lostTCV: number
      deals: Array<{
        id: number
        trailerType: string
        quantity: number
        monthlyRatePerUnit: number
        rentalTermMonths: number
        cancelledAt: string | null
        reason: string | null
      }>
    }
    const byLeadMap = new Map<number, LostByLead>()
    for (const d of lostAll) {
      const cur =
        byLeadMap.get(d.leadId) ??
        { leadId: d.leadId, companyName: d.companyName, count: 0, lostMRR: 0, lostTCV: 0, deals: [] }
      byLeadMap.set(d.leadId, {
        ...cur,
        count: cur.count + 1,
        lostMRR: cur.lostMRR + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit),
        lostTCV:
          cur.lostTCV +
          totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth),
        deals: [
          ...cur.deals,
          {
            id: d.id,
            trailerType: d.trailerType,
            quantity: d.quantity,
            monthlyRatePerUnit: d.monthlyRatePerUnit,
            rentalTermMonths: d.rentalTermMonths,
            cancelledAt: d.cancelledAt ?? d.closedAt ?? null,
            reason: d.cancellationReason ?? null,
          },
        ],
      })
    }
    const byLead = Array.from(byLeadMap.values()).sort((a, b) => b.lostTCV - a.lostTCV)

    interface LostByCustomer {
      companyName: string
      count: number
      lostMRR: number
      lostTCV: number
    }
    const byCustomerMap = new Map<string, LostByCustomer>()
    for (const d of lostAll) {
      const cur =
        byCustomerMap.get(d.companyName) ??
        { companyName: d.companyName, count: 0, lostMRR: 0, lostTCV: 0 }
      byCustomerMap.set(d.companyName, {
        ...cur,
        count: cur.count + 1,
        lostMRR: cur.lostMRR + monthlyDealRevenue(d.quantity, d.monthlyRatePerUnit),
        lostTCV:
          cur.lostTCV +
          totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths, d.isMonthToMonth),
      })
    }
    const byCustomer = Array.from(byCustomerMap.values()).sort((a, b) => b.lostTCV - a.lostTCV)

    return NextResponse.json({
      success: true,
      data: {
        repPerformance,
        pipelineHealth,
        cancelledDeals: { totalCount: lostAll.length, totalLostMRR, totalLostTCV, byLead, byCustomer },
      },
    })
  } catch (error) {
    console.error('CRM reports error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 })
  }
}
