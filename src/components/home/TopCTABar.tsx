import Link from 'next/link'
import { FileText, ClipboardList } from 'lucide-react'

export function TopCTABar() {
  return (
    <section className="bg-brand-blue py-3">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-center gap-4">
        <Link
          href="/credit-application"
          className="inline-flex items-center gap-2 px-10 py-3 bg-white text-brand-blue font-bold text-base rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-5 h-5" />
          Credit Application
        </Link>
        <Link
          href="/quote"
          className="inline-flex items-center gap-2 px-10 py-3 bg-white text-brand-blue font-bold text-base rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        >
          <ClipboardList className="w-5 h-5" />
          Get a Quote
        </Link>
      </div>
    </section>
  )
}
