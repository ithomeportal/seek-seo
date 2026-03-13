import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden py-14 md:py-20">
      {/* Geometric triangle decorations — inspired by old site */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] pointer-events-none select-none" aria-hidden="true">
        {/* Large center triangle */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '300px solid transparent',
            borderRight: '300px solid transparent',
            borderTop: '450px solid #e5e7eb',
            opacity: 0.3,
          }}
        />
        {/* Left triangle */}
        <div
          className="absolute top-0 left-[8%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '170px solid transparent',
            borderRight: '170px solid transparent',
            borderTop: '280px solid #d1d5db',
            opacity: 0.2,
          }}
        />
        {/* Right triangle */}
        <div
          className="absolute top-0 right-[8%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '170px solid transparent',
            borderRight: '170px solid transparent',
            borderTop: '280px solid #d1d5db',
            opacity: 0.2,
          }}
        />
      </div>

      <Container className="relative z-10">
        {/* Top row: CTA button | Welcome heading | Contact info */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 lg:gap-4">
          {/* Left: CTA button */}
          <div className="order-2 lg:order-1 animate-fade-in-up lg:pt-2">
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white border-2 font-semibold"
              >
                Our Services
              </Button>
            </Link>
          </div>

          {/* Center: Welcome tagline */}
          <div className="order-1 lg:order-2 text-center flex-1 animate-fade-in-up delay-100">
            <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              <span className="text-brand-orange">WELCOME TO SEEK!</span>
            </p>
            <p className="mt-2 text-xl md:text-2xl lg:text-3xl font-bold text-brand-blue tracking-tight">
              On The Move Solutions
            </p>
          </div>

          {/* Right: Contact info */}
          <div className="order-3 flex flex-col items-center lg:items-end gap-2 animate-fade-in-up delay-200 lg:pt-2">
            <a
              href={COMPANY.phoneHref}
              className="flex items-center gap-2 text-sm text-brand-blue hover:text-brand-orange transition-colors font-medium"
            >
              <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>T : {COMPANY.phone}</span>
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="flex items-center gap-2 text-sm text-brand-blue hover:text-brand-orange transition-colors font-medium"
            >
              <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{COMPANY.email}</span>
            </a>
          </div>
        </div>

        {/* SEO H1 + description */}
        <div className="mt-10 text-center animate-fade-in-up delay-300">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Trailer Rental &amp; Leasing{' '}
            <span className="text-brand-orange">in Texas</span>
          </h1>

          <p className="mt-4 text-gray-500 max-w-xl mx-auto leading-relaxed">
            250+ trailers ready for your business &mdash; DryVan, Tanker,
            Flatbed, Sand Chassis &amp; Belly Dump. Flexible rental and leasing
            terms across Texas, with cross-border service to Canada and Mexico.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/quote">
              <Button variant="primary" size="lg">
                Get a Free Quote
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white border"
              >
                View Our Fleet
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
