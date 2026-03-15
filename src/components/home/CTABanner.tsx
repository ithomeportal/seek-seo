import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function CTABanner() {
  return (
    <section className="py-16 bg-brand-blue">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Ready to Get Moving?
          </h2>

          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            Contact us for a free quote on trailer rentals and leasing.
            We&apos;ll match you with the right equipment for your needs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/quote">
              <Button variant="white" size="lg">
                Request a Quote
              </Button>
            </Link>
            <Link href={COMPANY.phoneHref}>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white hover:text-brand-blue border"
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
