import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function CTABanner() {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-orange via-brand-orange to-[#d44a14]">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-white/40" />
            <p className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase">
              Get Started Today
            </p>
            <div className="w-8 h-px bg-white/40" />
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Ready to Get Moving?
          </h2>

          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            Contact us for a free quote on trailer rentals and leasing.
            We&apos;ll match you with the right equipment for your needs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/quote">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-brand-orange shadow-xl shadow-black/10 hover:bg-gray-50 hover:shadow-2xl"
              >
                Request a Quote
              </Button>
            </Link>
            <Link href={COMPANY.phoneHref}>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white hover:text-brand-orange border"
              >
                Call {COMPANY.phone}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
