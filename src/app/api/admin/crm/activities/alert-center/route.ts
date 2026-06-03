import { NextResponse } from 'next/server'
import { crmTrailerLabel, totalContractValue } from '@/lib/crm'
import { listActivities, listDeals, listLeads, type CrmDeal } from '@/lib/crm-db'

export interface AlertCenterItem {
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

// All pending follow-ups with context + value badges. Section grouping
// (overdue/today/thisWeek/upcoming) happens on the client where local time rules.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const owner = url.searchParams.get('owner') ?? undefined

    const acts = await listActivities({ pendingOnly: true, owner })
    const withTime = acts.filter((a) => a.followUpAt)

    // Follow-ups against archived rows can still appear; include archived for resolution.
    const [allDeals, allLeads] = await Promise.all([
      listDeals({ includeArchived: true }),
      listLeads({ includeArchived: true }),
    ])
    const dealById = new Map(allDeals.map((d) => [d.id, d]))
    const leadById = new Map(allLeads.map((l) => [l.id, l]))
    const dealsByLead = new Map<number, CrmDeal[]>()
    for (const d of allDeals) {
      const list = dealsByLead.get(d.leadId) ?? []
      dealsByLead.set(d.leadId, [...list, d])
    }

    const items: AlertCenterItem[] = withTime.map((a) => {
      let companyName = ''
      let leadId: number | null = null
      let dealId: number | null = null
      let monthlyValue = 0
      let totalContract = 0
      let valueLabel = ''
      if (a.relatedToType === 'Lead') {
        const lead = leadById.get(a.relatedToId)
        if (lead) {
          companyName = lead.companyName
          leadId = lead.id
          const active = (dealsByLead.get(lead.id) ?? []).filter((d) => d.stage !== 'Closed Lost')
          monthlyValue = active.reduce((s, d) => s + d.quantity * d.monthlyRatePerUnit, 0)
          totalContract = active.reduce(
            (s, d) => s + totalContractValue(d.quantity, d.monthlyRatePerUnit, d.rentalTermMonths),
            0
          )
          valueLabel = active.length
            ? `Lead total · ${active.length} active deal${active.length === 1 ? '' : 's'}`
            : 'No active deals'
        }
      } else {
        const deal = dealById.get(a.relatedToId)
        if (deal) {
          companyName = deal.companyName
          dealId = deal.id
          leadId = deal.leadId
          monthlyValue = deal.quantity * deal.monthlyRatePerUnit
          totalContract = totalContractValue(deal.quantity, deal.monthlyRatePerUnit, deal.rentalTermMonths)
          valueLabel = `${crmTrailerLabel(deal.trailerType)} · qty ${deal.quantity} · ${deal.stage}`
        }
      }
      return {
        id: a.id,
        activityType: a.activityType,
        notes: a.notes,
        assignedTo: a.assignedTo,
        followUpAt: a.followUpAt,
        createdAt: a.createdAt,
        companyName,
        leadId,
        dealId,
        monthlyValue,
        totalContract,
        valueLabel,
      }
    })

    return NextResponse.json({ success: true, data: { items } })
  } catch (error) {
    console.error('CRM alert-center error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, error: 'Failed to load follow-ups' }, { status: 500 })
  }
}
