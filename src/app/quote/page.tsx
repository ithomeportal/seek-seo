import type { Metadata } from 'next'
import { Phone, Mail, CheckCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { QuoteForm } from '@/components/forms/QuoteForm'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Request a Trailer Rental Quote | SEEK Equipment',
  description:
    'Request a free, no-obligation trailer rental or leasing quote from SEEK Equipment. Customized pricing for DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump trailers.',
  openGraph: {
    title: 'Request a Trailer Rental Quote | SEEK Equipment',
    description:
      'Request a free, no-obligation trailer rental or leasing quote from SEEK Equipment. Customized pricing for DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump trailers.',
    url: `${COMPANY.url}/quote`,
    type: 'website',
  },
}

const benefits = [
  'Customized pricing for your needs',
  'Flexible rental and lease terms',
  'Fleet of 250+ well-maintained trailers',
  'Fast turnaround — most quotes within 2 hours',
  'No obligation',
]

export default function QuotePage() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Trailer Rental Quote',
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY.name,
      url: COMPANY.url,
      telephone: COMPANY.phone,
      email: COMPANY.email,
    },
    description:
      'Free, no-obligation trailer rental and leasing quotes for businesses across Texas.',
    areaServed: {
      '@type': 'State',
      name: 'Texas',
    },
  }

  return (
    <>
      <JsonLd data={serviceSchema} />

      {/* Hero */}
      <section className="bg-brand-blue text-white py-16 md:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Request a Quote' },
            ]}
          />
          <h1 className="text-4xl md:text-5xl font-bold mt-4">
            Request a Free Quote
          </h1>
          <p className="text-xl text-blue-100 mt-4 max-w-3xl">
            Fill out the form below and our team will get back to you within 2
            business hours with a customized rental or leasing quote.
          </p>
        </Container>
      </section>

      {/* Form + Sidebar */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Quote Form */}
            <div className="lg:col-span-2">
              <SectionHeading title="Tell Us What You Need" />
              <div className="mt-8">
                <QuoteForm />
              </div>
            </div>

            {/* Right: Benefits + Contact */}
            <div className="space-y-8">
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Why Get a Quote?
                </h2>
                <ul className="space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Prefer to Call?
                </h2>
                <p className="text-gray-600 mb-6">
                  Reach us directly for immediate assistance with your trailer
                  rental needs.
                </p>
                <div className="space-y-4">
                  <a
                    href={COMPANY.phoneHref}
                    className="flex items-center gap-3 text-brand-blue hover:text-brand-blue-dark font-semibold transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {COMPANY.phone}
                  </a>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="flex items-center gap-3 text-brand-blue hover:text-brand-blue-dark font-semibold transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    {COMPANY.email}
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 bg-gray-50">
        <Container>
          <div className="text-center">
            <p className="text-lg text-gray-700">
              Prefer to call? Reach us at{' '}
              <a
                href={COMPANY.phoneHref}
                className="text-brand-blue hover:text-brand-blue-dark font-bold transition-colors"
              >
                {COMPANY.phone}
              </a>
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
