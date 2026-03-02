import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

const trustIndicators = [
  { label: '250+ Trailers' },
  { label: 'Flexible Terms' },
  { label: '24/7 Support' },
  { label: 'Texas-Wide Service' },
]

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] h-[80vh] flex items-center bg-gradient-to-br from-brand-blue via-brand-blue-dark to-[#1a3a54] overflow-hidden">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />

      <Container className="relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Trailer Rental &amp; Leasing in Texas
          </h1>

          <p className="mt-6 text-xl text-white/80 max-w-2xl leading-relaxed">
            250+ trailers ready for your business. DryVan, Tanker, Flatbed,
            Sand Chassis &amp; Belly Dump &mdash; flexible terms, reliable fleet.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/quote">
              <Button variant="primary" size="lg">
                Get a Free Quote
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-brand-blue"
              >
                View Our Fleet
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustIndicators.map((indicator) => (
              <div
                key={indicator.label}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="h-2 w-2 rounded-full bg-brand-orange flex-shrink-0" />
                <span className="text-sm font-medium">{indicator.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
