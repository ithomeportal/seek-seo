import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'
import {
  CRM_TRAILER_TYPES,
  DEFAULT_ACTIVITY_OWNER,
  LEAD_STATUSES,
  MANUS_TYPE_MAP,
  type CrmTrailerType,
} from '@/lib/crm'

const importSchema = z.object({
  format: z.enum(['csv', 'json']),
  content: z.string().min(1),
})

type ImportRow = Record<string, unknown>

// Bulk lead import (CSV or JSON). Accepts both site trailer-type keys
// (sand_chassis) and MANUS labels (Sand Hopper/BD) in trailer_interest.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const errors: string[] = []
  let imported = 0
  let rows: ImportRow[] = []
  try {
    if (parsed.data.format === 'json') {
      const json: unknown = JSON.parse(parsed.data.content)
      if (!Array.isArray(json)) throw new Error('JSON must be an array of lead objects')
      rows = json as ImportRow[]
    } else {
      rows = parseCsv(parsed.data.content)
    }
  } catch (e) {
    return NextResponse.json({
      success: true,
      data: { imported: 0, errors: [`Parse error: ${e instanceof Error ? e.message : 'invalid content'}`] },
    })
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    try {
      const companyName = (r.company_name ?? r.companyName) as string | undefined
      if (!companyName || !String(companyName).trim()) throw new Error('missing company_name')

      const ti = r.trailer_interest ?? r.trailerInterest
      let rawInterest: string[] = []
      if (Array.isArray(ti)) rawInterest = ti.map(String)
      else if (typeof ti === 'string' && ti.trim()) {
        rawInterest = ti.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      }
      const trailerInterest = rawInterest
        .map((t) =>
          (CRM_TRAILER_TYPES as readonly string[]).includes(t)
            ? (t as CrmTrailerType)
            : MANUS_TYPE_MAP[t]
        )
        .filter((t): t is CrmTrailerType => Boolean(t))

      const statusRaw = typeof r.status === 'string' ? r.status : 'New'
      const status = (LEAD_STATUSES as readonly string[]).includes(statusRaw) ? statusRaw : 'New'

      await query(
        `INSERT INTO crm_leads
          (company_name, contact_name, email, phone, region, state, status, source,
           assigned_to, trailer_interest, notes, is_archived)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          String(companyName).trim(),
          ((r.contact_name ?? r.contactName) as string) || null,
          (r.email as string) || null,
          (r.phone as string) || null,
          (r.region as string) || null,
          typeof r.state === 'string' && r.state.trim() ? r.state.trim().toUpperCase().slice(0, 2) : null,
          status,
          (r.source as string) || 'Import',
          ((r.assigned_to ?? r.assignedTo) as string) || DEFAULT_ACTIVITY_OWNER,
          JSON.stringify(trailerInterest),
          (r.notes as string) || null,
          status === 'Lost',
        ]
      )
      imported++
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }

  return NextResponse.json({ success: true, data: { imported, errors } })
}

function parseCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const header = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows: ImportRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const obj: ImportRow = {}
    header.forEach((h, idx) => {
      obj[h] = cells[idx] ?? ''
    })
    rows.push(obj)
  }
  return rows
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQ = false
      } else cur += c
    } else {
      if (c === ',') {
        out.push(cur)
        cur = ''
      } else if (c === '"') inQ = true
      else cur += c
    }
  }
  out.push(cur)
  return out
}
