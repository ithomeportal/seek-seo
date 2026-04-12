import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { z } from 'zod'

const addDocSchema = z.object({
  unitId: z.number().int().positive(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.string().optional(),
  fileSize: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  const unitId = request.nextUrl.searchParams.get('unitId')
  if (!unitId) {
    return NextResponse.json(
      { success: false, error: 'unitId required' },
      { status: 400 }
    )
  }

  try {
    const result = await query(
      'SELECT * FROM unit_documents WHERE unit_id = $1 ORDER BY uploaded_at DESC',
      [parseInt(unitId, 10)]
    )

    const docs = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      unitId: row.unit_id,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileType: row.file_type,
      fileSize: row.file_size,
      uploadedAt: row.uploaded_at,
    }))

    return NextResponse.json({ success: true, data: docs })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = addDocSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      )
    }

    const d = parsed.data

    await query(
      `INSERT INTO unit_documents (unit_id, file_name, file_url, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5)`,
      [d.unitId, d.fileName, d.fileUrl, d.fileType ?? null, d.fileSize ?? null]
    )

    return NextResponse.json({ success: true, message: 'Document saved' })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to save document' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const docId = request.nextUrl.searchParams.get('id')
  if (!docId) {
    return NextResponse.json(
      { success: false, error: 'id required' },
      { status: 400 }
    )
  }

  try {
    await query('DELETE FROM unit_documents WHERE id = $1', [
      parseInt(docId, 10),
    ])
    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
