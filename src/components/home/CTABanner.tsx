import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

export function CTABanner() {
  return (
    <section className="py-16 bg-brand-blue">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Ready to Get Started?
          </h2>

          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            Contact our team today to discuss your equipment needs. We offer
            flexible terms and competitive rates on our entire fleet.
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
                className="border-white/40 text-white hover:bg-white hover:text-brand-blue border"
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
