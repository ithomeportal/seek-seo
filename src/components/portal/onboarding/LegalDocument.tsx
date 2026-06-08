'use client'

import type { DocBlock } from '@/lib/legal-documents'

/**
 * Renders transcribed legal-document text (from src/lib/legal-documents.ts) as
 * scrollable, read-only formatted copy. Used inside the ACH and lease/guaranty
 * onboarding forms so the customer reads the exact text that appears in the
 * signed PDF.
 */
export function LegalDocument({
  blocks,
  className = '',
}: {
  blocks: DocBlock[]
  className?: string
}) {
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'clause':
            return (
              <p key={i} className="mb-3 text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-gray-900">{block.num} </span>
                {block.text}
              </p>
            )
          case 'item':
            return (
              <p key={i} className="mb-2 pl-5 text-sm leading-relaxed text-gray-700">
                {block.text}
              </p>
            )
          case 'note':
            return (
              <p
                key={i}
                className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {block.text}
              </p>
            )
          default:
            return (
              <p key={i} className="mb-3 text-sm leading-relaxed text-gray-700">
                {block.text}
              </p>
            )
        }
      })}
    </div>
  )
}

/** Scrollable framed container for long documents. */
export function ScrollableDocument({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-5">
      {children}
    </div>
  )
}
