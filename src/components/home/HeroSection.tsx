import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function HeroSection() {
  return (
    <section className="relative bg-gray-50 overflow-hidden py-20 lg:py-28">
      {/* Background image */}
      <Image
        src="/images/hero/hero-bg.jpg"
        alt=""
        fill
        className="object-cover opacity-15"
        priority
        aria-hidden="true"
      />

      {/* Centered V-shapes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none" aria-hidden="true">
        {/* Outer V-shape */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '50vw solid transparent',
            borderRight: '50vw solid transparent',
            borderTop: '280px solid #e5e7eb',
          }}
        />
        {/* Inner V-shape */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '35vw solid transparent',
            borderRight: '35vw solid transparent',
            borderTop: '220px solid #f3f4f6',
          }}
        />
      </div>

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* SEO H1 styled as MANUS welcome */}
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tight leading-none text-brand-orange">
            WELCOME TO SEEK!
          </h1>
          <p className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a4b8c] tracking-tight italic">
            On The Move Solutions
          </p>
          <p className="mt-3 text-xl font-semibold text-gray-700">
            Professional Trailer Leasing
          </p>

          {/* Divider */}
          <div className="w-24 h-1 bg-brand-orange mx-auto mb-8 mt-6 rounded-full" />

          {/* Description */}
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            SEEK Equipment Rentals provides reliable, well-maintained trailers
            for the energy, construction, and transportation industries. Flexible
            terms, competitive rates, and dedicated support.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/equipment">
              <Button variant="primary" size="lg">
                View Our Fleet
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href={COMPANY.phoneHref}>
              <Button
                variant="outline"
                size="lg"
                className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white border"
              >
                <Phone className="w-5 h-5 mr-2" />
                {COMPANY.phone}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
