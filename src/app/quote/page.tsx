import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
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
        title="Get a Quote"
        description="Tell us about your equipment needs and our team will provide a competitive quote tailored to your requirements."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Get a Quote' },
        ]}
      />

      {/* Form Section */}
      <section className="bg-background py-16">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Request a Quote
              </h2>
              <QuoteForm />
              <p className="mt-6 text-center text-sm text-gray-500">
                Or call us directly at{' '}
                <a
                  href={COMPANY.phoneHref}
                  className="text-brand-blue hover:text-brand-blue-dark font-semibold transition-colors"
                >
                  {COMPANY.phone}
                </a>
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
