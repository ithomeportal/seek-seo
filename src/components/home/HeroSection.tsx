import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

export function HeroSection() {
  return (
    <section className="relative bg-gray-50 overflow-hidden py-16 md:py-24">
      {/* Geometric triangle decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] pointer-events-none select-none" aria-hidden="true">
        {/* Large center triangle */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '400px solid transparent',
            borderRight: '400px solid transparent',
            borderTop: '550px solid #e5e7eb',
            opacity: 0.3,
          }}
        />
        {/* Left triangle */}
        <div
          className="absolute top-0 left-[5%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '220px solid transparent',
            borderRight: '220px solid transparent',
            borderTop: '350px solid #d1d5db',
            opacity: 0.2,
          }}
        />
        {/* Right triangle */}
        <div
          className="absolute top-0 right-[5%]"
          style={{
            width: 0,
            height: 0,
            borderLeft: '220px solid transparent',
            borderRight: '220px solid transparent',
            borderTop: '350px solid #d1d5db',
            opacity: 0.2,
          }}
        />
      </div>

      <Container className="relative z-10">
        {/* Centered welcome */}
        <div className="text-center animate-fade-in-up">
          <p className="text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tight leading-none">
            <span className="text-brand-orange">WELCOME TO SEEK!</span>
          </p>
          <p className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-brand-blue tracking-tight italic">
            On The Move Solutions
          </p>
          <div className="w-24 h-1 bg-brand-orange mx-auto mt-6" />
        </div>

        {/* SEO H1 + description */}
        <div className="mt-10 text-center animate-fade-in-up delay-200">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Trailer Rental &amp; Leasing{' '}
            <span className="text-brand-orange">in Texas</span>
          </h1>

          <p className="mt-4 text-gray-500 max-w-xl mx-auto leading-relaxed">
            250+ trailers ready for your business &mdash; DryVan, Tanker,
            Flatbed, Sand Chassis, Sand Hopper &amp; Belly Dump. Flexible
            leasing terms with delivery across the continental United States.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/quote">
              <Button variant="primary" size="lg">
                Get a Free Quote
              </Button>
            </Link>
            <Link href="/equipment">
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
