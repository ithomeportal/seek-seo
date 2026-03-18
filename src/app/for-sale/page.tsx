import type { Metadata } from 'next'
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

      <section className="py-16">
        <Container>
          <div className="text-center py-16 bg-white rounded-xl border">
            <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Equipment Currently Listed
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We periodically list select units from our fleet for sale.
              Contact us to inquire about upcoming availability.
            </p>
            <a href={COMPANY.phoneHref}>
              <Button variant="primary" size="lg">
                <Phone className="mr-2 h-4 w-4" /> Call {COMPANY.phone}
              </Button>
            </a>
          </div>
        </Container>
      </section>
    </>
  )
}
