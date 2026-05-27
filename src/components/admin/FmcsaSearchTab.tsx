'use client'

import { useMemo, useState } from 'react'
import { Search, Download, RotateCw, Flame, Loader2 } from 'lucide-react'
import { CARGO_TOKENS, CARGO_PRESETS, type CargoToken } from '@/lib/fmcsa-cargo'
import type { FmcsaSearchResultRow } from '@/app/api/admin/fmcsa-search/route'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
] as const

const PAGE_SIZE_DEFAULT = 100

type SortKey = 'powerUnits' | 'legalName' | 'phyState' | 'phyCity'

interface SearchResponse {
  rows: FmcsaSearchResultRow[]
  total: number
  page: number
  pageSize: number
  datasetSize: number
  lastSyncedAt: string | null
  centerZip?: { zip: string; lat: number; lon: number; city: string | null; state: string | null }
}

const COL_FILTER_KEYS = [
  'dotNumber','legalName','dbaName','phyCity','phyState','phyZip',
  'phone','email','powerUnits','drivers','hmFlag','cargoCarried','distanceMiles',
] as const

export default function FmcsaSearchTab() {
  const [stateFilter, setStateFilter] = useState<string>('ALL')
  const [zip, setZip] = useState<string>('')
  const [radius, setRadius] = useState<number>(50)
  const [minPU, setMinPU] = useState<number>(20)
  const [maxPU, setMaxPU] = useState<number>(500)

  const [selectedCargo, setSelectedCargo] = useState<Set<CargoToken>>(() => new Set<CargoToken>())
  const [activePreset, setActivePreset] = useState<string>('CUSTOM')

  const [nameTokens, setNameTokens] = useState<string[]>([])
  const [nameInput, setNameInput] = useState<string>('')

  const [onlyActive, setOnlyActive] = useState<boolean>(true)
  const [hmOnly, setHmOnly] = useState<boolean>(false)
  const [hasContactOnly, setHasContactOnly] = useState<boolean>(false)
  const [recentMcs150Only, setRecentMcs150Only] = useState<boolean>(false)

  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [sortKey, setSortKey] = useState<SortKey>('powerUnits')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [page, setPage] = useState<number>(1)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [searching, setSearching] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const toggleCargo = (token: CargoToken) => {
    setSelectedCargo((prev) => {
      const next = new Set(prev)
      if (next.has(token)) next.delete(token)
      else next.add(token)
      return next
    })
    setActivePreset('CUSTOM')
  }

  const applyPreset = (preset: keyof typeof CARGO_PRESETS) => {
    setSelectedCargo(new Set(CARGO_PRESETS[preset] as readonly CargoToken[]))
    setActivePreset(preset)
  }

  const addNameToken = () => {
    const t = nameInput.trim().toLowerCase()
    if (!t) return
    if (!nameTokens.includes(t)) setNameTokens([...nameTokens, t])
    setNameInput('')
  }

  const removeNameToken = (t: string) => setNameTokens(nameTokens.filter((x) => x !== t))

  const resetAllFilters = () => {
    setStateFilter('ALL')
    setZip('')
    setRadius(50)
    setMinPU(20)
    setMaxPU(500)
    setSelectedCargo(new Set<CargoToken>())
    setActivePreset('CUSTOM')
    setNameTokens([])
    setNameInput('')
    setOnlyActive(true)
    setHmOnly(false)
    setHasContactOnly(false)
    setRecentMcs150Only(false)
    setColFilters({})
    setSortKey('powerUnits')
    setSortOrder('desc')
  }

  const runSearch = async (newPage = 1, overrides?: { sortKey?: SortKey; sortOrder?: 'asc' | 'desc' }) => {
    const effSortKey = overrides?.sortKey ?? sortKey
    const effSortOrder = overrides?.sortOrder ?? sortOrder
    const filters = {
      state: stateFilter && stateFilter !== 'ALL' ? stateFilter : undefined,
      zip: zip.trim().length === 5 ? zip.trim() : undefined,
      radiusMiles: zip.trim().length === 5 ? radius : undefined,
      minPowerUnits: minPU,
      maxPowerUnits: maxPU < 2000 ? maxPU : undefined,
      cargo: selectedCargo.size > 0 ? Array.from(selectedCargo) : undefined,
      nameTokens: nameTokens.length > 0 ? nameTokens : undefined,
      onlyActive,
      hmOnly,
      hasContactOnly,
      recentMcs150Only,
      page: newPage,
      pageSize: PAGE_SIZE_DEFAULT,
      sortBy: effSortKey,
      sortOrder: effSortOrder,
    }
    setPage(newPage)
    setSearching(true)
    setError('')
    try {
      const res = await fetch('/api/admin/fmcsa-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Search failed')
      setResults(json.data as SearchResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const toggleSort = (key: SortKey) => {
    const nextOrder: 'asc' | 'desc' =
      sortKey === key ? (sortOrder === 'asc' ? 'desc' : 'asc') : key === 'powerUnits' ? 'desc' : 'asc'
    setSortKey(key)
    setSortOrder(nextOrder)
    runSearch(1, { sortKey: key, sortOrder: nextOrder })
  }

  const visibleRows = useMemo(() => {
    if (!results) return []
    let rows = results.rows
    for (const [col, val] of Object.entries(colFilters)) {
      const v = val.trim().toLowerCase()
      if (!v) continue
      rows = rows.filter((r) => {
        const cell = (r as unknown as Record<string, unknown>)[col]
        if (col === 'hmFlag') return (cell === true ? 'y hazmat yes' : 'n no').includes(v)
        if (cell == null) return false
        if (Array.isArray(cell)) return cell.some((x) => String(x).toLowerCase().includes(v))
        return String(cell).toLowerCase().includes(v)
      })
    }
    return rows
  }, [results, colFilters])

  const exportCsv = () => {
    if (!results || visibleRows.length === 0) return
    const header = [
      'DOT','MC','Legal Name','DBA','Address','City','State','ZIP',
      'Phone','Email','Power Units','Drivers','Status','HazMat','Cargo',
      'Distance (mi)','Latitude','Longitude',
    ]
    const esc = (v: unknown) => {
      if (v == null) return ''
      const s = String(v).replace(/"/g, '""')
      return /[",\n]/.test(s) ? `"${s}"` : s
    }
    const lines = [header.join(',')]
    for (const r of visibleRows) {
      lines.push([
        r.dotNumber, r.mcNumber, r.legalName, r.dbaName,
        r.phyStreet, r.phyCity, r.phyState, r.phyZip,
        r.phone, r.email, r.powerUnits, r.drivers, r.operatingStatus,
        r.hmFlag ? 'Y' : 'N', r.cargoCarried.join(' / '),
        r.distanceMiles?.toFixed(1), r.latitude, r.longitude,
      ].map(esc).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fmcsa-search-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = results ? Math.max(1, Math.ceil(results.total / results.pageSize)) : 1

  const inputCls = 'rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue'
  const chk = 'h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">FMCSA Search</h2>
        <p className="text-sm text-gray-500">
          Search the nationwide FMCSA carrier registry by state, ZIP + radius, fleet size, cargo type, and name.
          {results && (
            <>
              {' '}{results.datasetSize.toLocaleString()} carriers on file
              {results.lastSyncedAt ? ` • last synced ${results.lastSyncedAt.slice(0, 16).replace('T', ' ')} UTC` : ''}.
            </>
          )}{' '}
          Data refreshes weekly.
        </p>
      </div>

      {/* --- Filters --- */}
      <div className="rounded-lg border bg-gray-50 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-gray-700">State</span>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className={inputCls}>
              <option value="ALL">Any state</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-gray-700">ZIP code</span>
            <input
              placeholder="e.g. 75201" inputMode="numeric" maxLength={5} value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className={inputCls}
            />
          </label>
          <div className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Radius (miles)</span>
              <span className="font-medium">{radius} mi</span>
            </div>
            <input
              type="range" min={10} max={500} step={10} value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10))}
              disabled={zip.trim().length !== 5}
              className="w-full accent-brand-orange disabled:opacity-40"
            />
            {zip.trim().length !== 5 && <p className="text-xs text-gray-400">Enter a 5-digit ZIP to enable radius search.</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Min power units</span>
              <span className="font-medium">{minPU}</span>
            </div>
            <input type="range" min={1} max={500} step={1} value={minPU}
              onChange={(e) => setMinPU(parseInt(e.target.value, 10))} className="w-full accent-brand-orange" />
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Max power units</span>
              <span className="font-medium">{maxPU >= 2000 ? '∞' : maxPU}</span>
            </div>
            <input type="range" min={5} max={2000} step={5} value={maxPU}
              onChange={(e) => setMaxPU(parseInt(e.target.value, 10))} className="w-full accent-brand-orange" />
          </div>
        </div>

        {/* Cargo presets + multi-select */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-gray-700">Cargo preset</span>
            {(Object.keys(CARGO_PRESETS) as (keyof typeof CARGO_PRESETS)[]).map((p) => (
              <button key={p} type="button" onClick={() => applyPreset(p)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium border ${
                  activePreset === p ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}>
                {p.replaceAll('_', ' ')}
              </button>
            ))}
            <button type="button" onClick={() => { setSelectedCargo(new Set()); setActivePreset('CUSTOM') }}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(Object.keys(CARGO_TOKENS) as CargoToken[]).map((token) => (
              <label key={token} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selectedCargo.has(token)} onChange={() => toggleCargo(token)} className={chk} />
                <span>{CARGO_TOKENS[token]}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Cargo filters use the MCS-150 cargo flags carriers self-declare. Presets select the cargo types most associated with a trailer style.
          </p>
        </div>

        {/* Name tokens */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Name contains (ANY)</span>
          <div className="flex items-center gap-2">
            <input placeholder='e.g. "aggregate", "mix", "ready-mix"' value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNameToken() } }}
              className={`${inputCls} flex-1`} />
            <button type="button" onClick={addNameToken}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {nameTokens.map((t) => (
              <button key={t} type="button" onClick={() => removeNameToken(t)}
                className="rounded bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/20">
                {t} ×
              </button>
            ))}
            {nameTokens.length === 0 && <span className="text-xs text-gray-400">No name filter — matches all carriers.</span>}
          </div>
        </div>

        {/* HazMat toggle */}
        <label className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition ${
          hmOnly ? 'border-brand-orange bg-orange-50 ring-1 ring-orange-300' : 'border-orange-200 bg-orange-50/40 hover:border-orange-300'
        }`}>
          <input type="checkbox" checked={hmOnly} onChange={(e) => setHmOnly(e.target.checked)} className={`mt-0.5 ${chk}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-semibold text-orange-900">
              <Flame className="h-4 w-4" /> HazMat carriers only
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Only carriers that self-declared on their MCS-150 that they transport hazardous materials (FMCSA hm_ind = Y).
            </p>
          </div>
        </label>

        {/* Quality filters */}
        <div className="rounded-md border bg-white p-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quality filters</div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className={chk} />
            <span>Only carriers with <strong>ACTIVE</strong> FMCSA operating status</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={hasContactOnly} onChange={(e) => setHasContactOnly(e.target.checked)} className={chk} />
            <span>Only carriers <strong>with email or phone</strong>
              <span className="ml-1 text-xs text-gray-400">(hides rows you can&apos;t contact)</span>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={recentMcs150Only} onChange={(e) => setRecentMcs150Only(e.target.checked)} className={chk} />
            <span>Only carriers with <strong>MCS-150 filed in the last 24 months</strong>
              <span className="ml-1 text-xs text-gray-400">(filters out stale/likely-defunct carriers)</span>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button onClick={resetAllFilters} disabled={searching}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            <RotateCw className="h-4 w-4" /> Reset filters
          </button>
          <button onClick={exportCsv} disabled={!results || visibleRows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-blue px-3 py-2 text-sm font-medium text-brand-blue hover:bg-blue-50 disabled:opacity-50">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => runSearch(1)} disabled={searching}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90 disabled:opacity-50">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* --- Results summary --- */}
      {results && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {results.total.toLocaleString()} matches ({visibleRows.length} on this page after column filters).
            {results.centerZip && ` Centered on ${results.centerZip.city || results.centerZip.zip}, ${results.centerZip.state || ''}.`}
          </span>
          <span>Page {results.page} / {totalPages}</span>
        </div>
      )}

      {/* --- Table --- */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <ColHeader label="DOT" />
              <ColHeader label="Legal name" sortable active={sortKey === 'legalName'} order={sortOrder} onSort={() => toggleSort('legalName')} />
              <ColHeader label="DBA" />
              <ColHeader label="City" sortable active={sortKey === 'phyCity'} order={sortOrder} onSort={() => toggleSort('phyCity')} />
              <ColHeader label="State" sortable active={sortKey === 'phyState'} order={sortOrder} onSort={() => toggleSort('phyState')} />
              <ColHeader label="ZIP" />
              <ColHeader label="Phone" />
              <ColHeader label="Email" />
              <ColHeader label="Units" align="right" sortable active={sortKey === 'powerUnits'} order={sortOrder} onSort={() => toggleSort('powerUnits')} />
              <ColHeader label="Drivers" align="right" />
              <ColHeader label="HazMat" align="center" />
              <ColHeader label="Cargo" />
              <ColHeader label="Dist (mi)" align="right" />
            </tr>
            <tr className="border-b bg-gray-50">
              {COL_FILTER_KEYS.map((c) => (
                <th key={`f-${c}`} className="p-1">
                  <input
                    className="h-7 w-full rounded border border-gray-200 px-1.5 text-xs focus:border-brand-blue focus:outline-none"
                    placeholder={c === 'hmFlag' ? 'Y / N' : 'filter…'}
                    value={colFilters[c] || ''}
                    onChange={(e) => setColFilters({ ...colFilters, [c]: e.target.value })}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {searching && (
              <tr><td colSpan={13} className="py-10 text-center text-gray-400">
                <Loader2 className="inline h-4 w-4 mr-2 animate-spin" /> Searching FMCSA census…
              </td></tr>
            )}
            {!searching && (!results || results.rows.length === 0) && (
              <tr><td colSpan={13} className="py-10 text-center text-gray-400">
                {results ? 'No carriers match — widen the filters.' : 'Set your filters and click Search.'}
              </td></tr>
            )}
            {!searching && visibleRows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-blue-50/40">
                <td className="px-3 py-2 font-mono text-xs">{r.dotNumber}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{r.legalName || '—'}</td>
                <td className="px-3 py-2 text-gray-600">{r.dbaName || '—'}</td>
                <td className="px-3 py-2 text-gray-600">{r.phyCity || '—'}</td>
                <td className="px-3 py-2 text-gray-600">{r.phyState || '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.phyZip || '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.phone || '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600 max-w-[180px] truncate" title={r.email || undefined}>{r.email || '—'}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.powerUnits ?? '—'}</td>
                <td className="px-3 py-2 text-right text-gray-600">{r.drivers ?? '—'}</td>
                <td className="px-3 py-2 text-center">
                  {r.hmFlag ? (
                    <span className="inline-flex items-center gap-1 rounded border border-orange-400 bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-800" title="MCS-150 hazmat indicator = Y">
                      <Flame className="h-3 w-3" /> HazMat
                    </span>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600 max-w-[220px]">
                  {r.cargoCarried.length > 0 ? (
                    <span className="line-clamp-2" title={r.cargoCarried.join(', ')}>
                      {r.cargoCarried.map((c) => c.replaceAll('_', ' ')).join(', ')}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{r.distanceMiles != null ? r.distanceMiles.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Pagination --- */}
      {results && results.total > results.pageSize && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => runSearch(page - 1)} disabled={page <= 1 || searching}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">← Prev</button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => runSearch(page + 1)} disabled={page >= totalPages || searching}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}

function ColHeader({
  label, align, sortable, active, order, onSort,
}: {
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  active?: boolean
  order?: 'asc' | 'desc'
  onSort?: () => void
}) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th className={`px-3 py-2 font-medium ${alignCls}`}>
      {sortable ? (
        <button type="button" onClick={onSort}
          className={`inline-flex items-center gap-1 hover:text-brand-blue ${active ? 'text-brand-blue font-semibold' : ''}`}>
          {label}{active && <span>{order === 'asc' ? '▲' : '▼'}</span>}
        </button>
      ) : label}
    </th>
  )
}
