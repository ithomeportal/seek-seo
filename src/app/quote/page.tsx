import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { QuoteForm } from '@/components/forms/QuoteForm'
import { PageHero } from '@/components/layout/PageHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Request a Trailer Rental Quote | SEEK Equipment',
  description:
    'Request a free, no-obligation trailer rental or leasing quote from SEEK Equipment. Customized pricing for DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump trailers.',
  alternates: { canonical: '/quote' },
  openGraph: {
    title: 'Request a Trailer Rental Quote | SEEK Equipment',
    description:
      'Request a free, no-obligation trailer rental or leasing quote from SEEK Equipment. Customized pricing for DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump trailers.',
    url: `${COMPANY.url}/quote`,
    type: 'website',
  },
}

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

      <PageHero
        title="Request a Free Quote"
        description="Fill out the form below and our team will get back to you within 2 business hours with a customized rental or leasing quote."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Request a Quote' },
        ]}
      />

      {/* Form */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="max-w-2xl mx-auto">
            <SectionHeading title="Tell Us What You Need" centered />
            <div className="mt-8">
              <QuoteForm />
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
