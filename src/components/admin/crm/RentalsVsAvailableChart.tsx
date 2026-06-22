'use client'

import { formatCurrency } from './types'

export interface RentalPoint {
  label: string
  monthIso: string
  rentedUnits: number
  availableUnits: number
  availableRevenue: number
}

interface Props {
  points: RentalPoint[]
  capacityUnits: number
  capacityRevenue: number
}

// Dependency-free SVG line chart: a flat orange "Total Fleet (Capacity)" line and
// a blue "Available Units" line over the trailing 12 months. Matches the repo's
// no-extra-deps convention (no chart library).
const VB_W = 1000
const VB_H = 340
const PAD = { left: 44, right: 24, top: 44, bottom: 42 }

export default function RentalsVsAvailableChart({ points, capacityUnits, capacityRevenue }: Props) {
  if (!points.length) {
    return <p className="text-base text-gray-500">No rental data to chart yet.</p>
  }

  const plotW = VB_W - PAD.left - PAD.right
  const plotH = VB_H - PAD.top - PAD.bottom
  const n = points.length

  const rawMax = Math.max(capacityUnits, ...points.map((p) => p.availableUnits), 1)
  const yMax = Math.max(15, Math.ceil((rawMax * 1.2) / 15) * 15)

  const x = (i: number) => PAD.left + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1))
  const y = (v: number) => PAD.top + plotH * (1 - v / yMax)

  const availLine = points.map((p, i) => `${x(i)},${y(p.availableUnits)}`).join(' ')
  const capY = y(capacityUnits)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * (1 - f)))

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label="12-month rentals vs available capacity">
        {/* horizontal gridlines + y labels */}
        {gridLines.map((val) => {
          const gy = y(val)
          return (
            <g key={val}>
              <line x1={PAD.left} y1={gy} x2={VB_W - PAD.right} y2={gy} stroke="#eef0f2" strokeWidth={1} />
              <text x={PAD.left - 8} y={gy + 4} textAnchor="end" fontSize={11} fill="#9ca3af">
                {val}
              </text>
            </g>
          )
        })}

        {/* capacity (orange, flat) */}
        <line
          x1={PAD.left}
          y1={capY}
          x2={VB_W - PAD.right}
          y2={capY}
          stroke="#ee5519"
          strokeWidth={2.5}
        />
        {points.map((p, i) => (
          <g key={`cap-${p.monthIso}`}>
            <circle cx={x(i)} cy={capY} r={3.5} fill="#fff" stroke="#ee5519" strokeWidth={2} />
            {(i === 0 || i === n - 1) && (
              <>
                <text x={x(i)} y={capY - 16} textAnchor="middle" fontSize={11} fontWeight={700} fill="#c2410c">
                  {capacityUnits}u
                </text>
                <text x={x(i)} y={capY - 4} textAnchor="middle" fontSize={10} fill="#ea580c">
                  {formatCurrency(capacityRevenue)}
                </text>
              </>
            )}
          </g>
        ))}

        {/* available (blue) */}
        <polyline points={availLine} fill="none" stroke="#2563eb" strokeWidth={2.5} />
        {points.map((p, i) => (
          <g key={`av-${p.monthIso}`}>
            <circle cx={x(i)} cy={y(p.availableUnits)} r={3.5} fill="#fff" stroke="#2563eb" strokeWidth={2} />
            <text x={x(i)} y={y(p.availableUnits) + 18} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1d4ed8">
              {p.availableUnits}u
            </text>
            <text x={x(i)} y={y(p.availableUnits) + 30} textAnchor="middle" fontSize={9.5} fill="#3b82f6">
              {formatCurrency(p.availableRevenue)}
            </text>
            {/* x-axis month label */}
            <text x={x(i)} y={VB_H - PAD.bottom + 22} textAnchor="middle" fontSize={11} fill="#6b7280">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* legend */}
      <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
          <span className="inline-block w-4 h-0.5 bg-brand-orange" /> Total Fleet (Capacity)
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
          <span className="inline-block w-4 h-0.5" style={{ backgroundColor: '#2563eb' }} /> Available Units
        </span>
      </div>
    </div>
  )
}
