import Link from 'next/link'

export function TopCTABar() {
  return (
    <section className="bg-brand-blue py-3">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-center gap-4">
        <Link
          href="/credit-application"
          className="inline-flex items-center px-5 py-2 bg-white text-brand-blue font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Credit Application
        </Link>
        <Link
          href="/quote"
          className="inline-flex items-center px-5 py-2 bg-white text-brand-blue font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Get a Quote
        </Link>
      </div>
    </section>
  )
}
