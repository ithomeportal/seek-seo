import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function HeroSection() {
  return (
    <section className="relative min-h-[600px] h-[85vh] flex items-center overflow-hidden">
      {/* Background image with zoom effect */}
      <Image
        src="/images/hero/hero-bg.jpg"
        alt="White trailer at distribution center"
        fill
        className="object-cover scale-105"
        priority
        sizes="100vw"
      />

      {/* Multi-layer overlay for cinematic depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      <Container className="relative z-10">
        <div className="max-w-2xl">
          {/* Subtitle with accent line */}
          <div className="flex items-center gap-3 animate-fade-in-up">
            <div className="w-8 h-px bg-brand-orange" />
            <p className="text-brand-orange font-semibold text-sm tracking-[0.2em] uppercase">
              Welcome to SEEK
            </p>
          </div>

          <h1 className="mt-5 text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] tracking-tight animate-fade-in-up delay-100">
            Trailer Rental &amp; Leasing
            <br />
            <span className="text-brand-orange">in Texas</span>
          </h1>

          <p className="mt-6 text-lg text-white/75 max-w-lg leading-relaxed animate-fade-in-up delay-200">
            250+ trailers ready for your business &mdash; DryVan, Tanker,
            Flatbed, Sand Chassis &amp; Belly Dump with flexible terms.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-300">
            <Link href="/quote">
              <Button variant="primary" size="lg">
                Get a Free Quote
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white hover:text-gray-900 border"
              >
                View Our Fleet
              </Button>
            </Link>
          </div>

          {/* Contact bar - glass effect */}
          <div className="mt-10 inline-flex flex-col sm:flex-row gap-4 sm:gap-6 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 animate-fade-in-up delay-400">
            <a
              href={COMPANY.phoneHref}
              className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-medium">{COMPANY.phone}</span>
            </a>
            <div className="hidden sm:block w-px h-4 bg-white/20 self-center" />
            <a
              href={`mailto:${COMPANY.email}`}
              className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">{COMPANY.email}</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}
