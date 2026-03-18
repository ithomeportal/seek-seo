import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { COMPANY } from '@/lib/constants'

const benefits = [
  'Comprehensive fleet of specialized trailers',
  'Competitive rental and lease rates',
  'Dedicated account management',
  'Industry-leading maintenance standards',
]

export function CargoSection() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
              Why Choose SEEK Equipment?
            </h2>

            <p className="mt-4 text-gray-500 leading-relaxed">
              With years of experience serving the energy, construction, and
              transportation industries, SEEK Equipment has built a reputation
              for reliability, quality equipment, and outstanding customer
              service.
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/contact">
                <Button variant="primary" size="lg">
                  Contact Us Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Image with floating phone box */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/trailers/flatbed-stock.jpg"
                alt="SEEK Equipment flatbed trailer"
                width={800}
                height={533}
                className="object-cover w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Floating phone box */}
            <div className="absolute -bottom-6 -right-6 bg-brand-blue text-white rounded-xl p-6 shadow-lg">
              <Link
                href={COMPANY.phoneHref}
                className="flex items-center gap-3"
              >
                <Phone className="w-6 h-6" />
                <div>
                  <p className="text-lg font-bold">{COMPANY.phone}</p>
                  <p className="text-sm text-white/80">
                    Call for immediate assistance
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
