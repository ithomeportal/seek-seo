'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

const SAMPLE_CSV = `company_name,contact_name,email,phone,region,state,source,assigned_to,trailer_interest,notes
Acme Trucking,Jane Smith,jane@acmetrucking.com,210-555-0101,Eagle Ford,TX,Cold Call,E. Mendoza,"Sand Chassis;Belly Dump",Met at the yard`

interface ImportResult {
  imported: number
  errors: string[]
}

export default function CrmImportTab() {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    const text = await file.text()
    setContent(text)
    if (file.name.toLowerCase().endsWith('.json')) setFormat('json')
    else setFormat('csv')
  }

  async function handleImport() {
    if (!content.trim()) {
      setError('Paste CSV/JSON content or pick a file first')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/admin/crm/import/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, content }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Import failed')
      setResult(json.data as ImportResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-1">Import Leads</h3>
        <p className="text-base text-gray-600 mb-3">
          Upload or paste a CSV / JSON list of leads. Required column: <code className="text-sm bg-gray-100 px-1 rounded">company_name</code>.
          Optional: contact_name, email, phone, region, state, status, source, assigned_to,
          trailer_interest (comma/semicolon separated), notes.
        </p>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setFormat('csv')}
              className={`px-3 py-1.5 text-sm font-semibold ${format === 'csv' ? 'bg-brand-orange text-white' : 'bg-white text-gray-700'}`}
            >
              CSV
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1.5 text-sm font-semibold ${format === 'json' ? 'bg-brand-orange text-white' : 'bg-white text-gray-700'}`}
            >
              JSON
            </button>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" /> Pick file
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </label>
          <button
            onClick={() => setContent(SAMPLE_CSV)}
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Load sample CSV
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder={format === 'csv' ? SAMPLE_CSV : '[{"company_name": "Acme Trucking", "email": "jane@acme.com"}]'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
        />

        <div className="flex items-center justify-end mt-3">
          <button
            onClick={handleImport}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-brand-orange text-white text-base font-semibold hover:bg-brand-orange/90 disabled:opacity-50"
          >
            {busy ? 'Importing…' : 'Import Leads'}
          </button>
        </div>

        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
        {result && (
          <div className="mt-3 rounded-lg border border-gray-200 p-3">
            <p className="text-base font-semibold text-emerald-700">{result.imported} leads imported.</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-semibold text-rose-600">{result.errors.length} rows failed:</p>
                <ul className="text-sm text-gray-600 list-disc ml-5 mt-1 space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
