import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function CTABanner() {
  return (
    <section className="py-20 bg-brand-orange">
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Get Moving?
          </h2>

          <p className="mt-4 text-lg text-white/90 leading-relaxed">
            Contact us today for a free quote on trailer rentals and leasing.
            We&apos;ll match you with the right equipment for your needs.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/quote">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-brand-orange hover:bg-gray-100"
              >
                Request a Quote
              </Button>
            </Link>
            <Link href={COMPANY.phoneHref}>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-brand-orange"
              >
                Call Now: {COMPANY.phone}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
