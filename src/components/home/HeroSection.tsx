import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] h-[80vh] flex items-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/hero/hero-bg.jpg"
        alt="White trailer at distribution center"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />

      <Container className="relative z-10">
        <div className="max-w-3xl">
          {/* WordPress-style "WELCOME TO SEEK!" heading */}
          <p className="text-brand-orange font-semibold text-lg tracking-wide uppercase">
            Welcome to SEEK!
          </p>

          <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            On the Move Solutions
          </h1>

          <p className="mt-6 text-xl text-white/85 max-w-2xl leading-relaxed">
            250+ trailers ready for your business. DryVan, Tanker, Flatbed,
            Sand Chassis &amp; Belly Dump &mdash; flexible terms, reliable fleet.
          </p>

          {/* Contact info prominently displayed like WordPress */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 text-white/90">
            <a
              href={COMPANY.phoneHref}
              className="flex items-center gap-2 text-lg font-semibold hover:text-brand-orange transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {COMPANY.phone}
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="flex items-center gap-2 text-lg font-semibold hover:text-brand-orange transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {COMPANY.email}
            </a>
          </div>

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
        </div>
      </Container>
    </section>
  )
}
