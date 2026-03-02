'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AccordionProps {
  items: { question: string; answer: string }[]
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        'w-5 h-5 text-brand-blue transition-transform duration-300',
        open && 'rotate-180'
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export function Accordion({ items }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  function toggle(index: number) {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
      {items.map((item, index) => {
        const isOpen = openItems.has(index)
        return (
          <div key={index}>
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-lg text-gray-900">
                {item.question}
              </span>
              <ChevronIcon open={isOpen} />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                isOpen ? 'max-h-96 pb-5' : 'max-h-0'
              )}
            >
              <p className="text-gray-600">{item.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
