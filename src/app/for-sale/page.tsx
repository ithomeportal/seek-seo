import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Tag } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { PageHero } from '@/components/layout/PageHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Equipment for Sale | SEEK Equipment',
  description:
    'Select trailers from our fleet are available for purchase. Sand Chassis, Belly Dumps, Tankers, Flatbeds, DryVans, and Sand Hoppers. Contact SEEK Equipment for pricing.',
  alternates: { canonical: '/for-sale' },
  openGraph: {
    title: 'Equipment for Sale | SEEK Equipment',
    description:
      'Select trailers from our fleet are available for purchase. Contact SEEK Equipment for pricing and availability.',
    url: `${COMPANY.url}/for-sale`,
    type: 'website',
  },
}

export default function ForSalePage() {
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Equipment for Sale',
    description:
      'Select units from the SEEK Equipment fleet available for purchase.',
    url: `${COMPANY.url}/for-sale`,
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY.name,
      telephone: COMPANY.phone,
    },
  }

  return (
    <>
      <JsonLd data={pageSchema} />

      <PageHero
        title="Equipment for Sale"
        description="Select units from our fleet are available for purchase. Each unit has been professionally maintained and inspected. Contact us for pricing details and availability."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Equipment for Sale' },
        ]}
      />

      {/* Content */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Equipment Currently Listed
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We periodically list select units from our fleet for sale. Contact
              us to inquire about upcoming availability or to be notified when
              new listings are posted.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={COMPANY.phoneHref}>
                <Button variant="primary" size="lg">
                  <Phone className="mr-2 h-4 w-4" /> Call {COMPANY.phone}
                </Button>
              </a>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-brand-blue">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Looking to Lease Instead?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              SEEK Equipment offers flexible leasing on our entire fleet of 250+
              trailers. Get a no-obligation quote today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote">
                <Button variant="primary" size="lg">
                  Get a Free Quote
                </Button>
              </Link>
              <Link href="/equipment">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-brand-blue"
                >
                  View Our Fleet
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
