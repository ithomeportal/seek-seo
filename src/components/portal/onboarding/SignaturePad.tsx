'use client'

import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Touch/mouse/pen signature pad. Captures a drawn signature as a PNG data URL
 * (`data:image/png;base64,...`) and reports it through `onChange`. The drawn
 * image is embedded into the generated PDF; the typed name is kept separately.
 */
export function SignaturePad({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (dataUrl: string) => void
  error?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(Boolean(value))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1f2937'
  }, [])

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    drawing.current = true
    last.current = point(e)
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !last.current) return
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    setHasInk(true)
  }

  function end() {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    const canvas = canvasRef.current
    if (canvas && hasInk) onChange(canvas.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange('')
  }

  return (
    <div>
      <div
        className={cn(
          'relative rounded-lg border-2 bg-white',
          error ? 'border-red-500' : 'border-dashed border-gray-300'
        )}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full touch-none rounded-lg"
          style={{ height: '180px' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            Sign here — draw with your finger, pen, or mouse
          </span>
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          <Eraser className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  )
}
