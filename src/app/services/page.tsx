import { Metadata } from 'next'
import Link from 'next/link'
import { services } from '@/data/services'
import { COMPANY } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Trailer Rental & Leasing Services | SEEK Equipment',
  description:
    'Explore SEEK Equipment\'s full fleet of rental trailers: DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump trailers. Flexible short-term and long-term leasing in Texas. Call 1-210-802-0000.',
  alternates: {
    canonical: `${COMPANY.url}/services`,
  },
}

const SPEC_PREVIEWS: Record<string, string[]> = {
  dryvan: ['Length', 'Max Payload', 'Cubic Capacity'],
  tanker: ['Capacity', 'Material', 'DOT Rating'],
  flatbed: ['Length', 'Max Payload', 'Deck Height'],
  'sand-chassis': ['Gross Capacity', 'Sand Capacity', 'Box Configuration'],
  'belly-dump': ['Capacity', 'Max Payload', 'Gate Type'],
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  dryvan: (
    <svg className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  tanker: (
    <svg className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  flatbed: (
    <svg className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  ),
  'sand-chassis': (
    <svg className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  'belly-dump': (
    <svg className="w-10 h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
    </svg>
  ),
}

export default function ServicesPage() {
  const serviceSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SEEK Equipment Trailer Rental Services',
    description: 'Complete fleet of commercial trailers available for rent and lease in Texas.',
    numberOfItems: services.length,
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.title,
        description: service.description,
        url: `${COMPANY.url}/services/${service.slug}`,
        provider: {
          '@type': 'LocalBusiness',
          name: COMPANY.name,
        },
      },
    })),
  }

  return (
    <>
      <JsonLd data={serviceSchemaData} />

      <section className="bg-brand-blue py-16 md:py-20">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services' },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold text-white">
              Our Trailer Rental &amp; Leasing Services
            </h1>
            <p className="mt-6 text-lg text-blue-100 leading-relaxed">
              SEEK Equipment operates a fleet of {COMPANY.fleetSize}+ commercial trailers out of{' '}
              {COMPANY.address.city}, {COMPANY.address.state}. Whether you need a dry van for
              general freight, a tanker for liquid transport, a flatbed for heavy equipment, a
              sand chassis for oilfield operations, or a belly dump for construction aggregate
              &mdash; we have the right trailer with flexible rental and leasing terms to fit
              your schedule and budget.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24 bg-gray-50">
        <Container>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const specKeys = SPEC_PREVIEWS[service.slug] ?? Object.keys(service.specs).slice(0, 3)
              return (
                <Card key={service.slug} hover>
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 p-3 bg-brand-blue/5 rounded-lg">
                        {SERVICE_ICONS[service.slug]}
                      </div>
                      <div>
                        <Badge variant="blue">{service.shortTitle}</Badge>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mt-2">
                      <Link
                        href={`/services/${service.slug}`}
                        className="hover:text-brand-blue transition-colors"
                      >
                        {service.title}
                      </Link>
                    </h3>

                    <p className="mt-3 text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {service.description}
                    </p>

                    <div className="mt-5 space-y-2">
                      {specKeys.map((key) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-500">{key}</span>
                          <span className="font-medium text-gray-900">{service.specs[key]}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Link
                        href={`/services/${service.slug}`}
                        className="inline-flex items-center gap-2 font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors"
                      >
                        View Details
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <SectionHeading
              title="Why Rent or Lease From SEEK Equipment?"
              centered
            />
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-brand-blue/10 mb-4">
                  <svg className="w-7 h-7 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Flexible Terms</h3>
                <p className="text-sm text-gray-600">
                  Daily, weekly, monthly, and long-term lease options. No rigid contracts &mdash; scale your fleet up or down as needed.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-brand-blue/10 mb-4">
                  <svg className="w-7 h-7 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">DOT Compliant</h3>
                <p className="text-sm text-gray-600">
                  Every trailer is inspected and maintained to DOT standards. Road-ready upon delivery with current safety certifications.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-brand-blue/10 mb-4">
                  <svg className="w-7 h-7 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Texas-Wide Delivery</h3>
                <p className="text-sm text-gray-600">
                  Delivery and pickup throughout Texas and surrounding states from our yard in {COMPANY.address.city}, {COMPANY.address.state}.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-20 bg-brand-blue">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Need Help Choosing the Right Trailer?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Not sure which trailer type fits your operation? Our team can help match you with the
              right equipment based on your cargo, route, and budget. Get a free, no-obligation
              quote today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote">
                <Button variant="primary" size="lg">
                  Get a Free Quote
                </Button>
              </Link>
              <a href={COMPANY.phoneHref}>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand-blue">
                  Call {COMPANY.phone}
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
