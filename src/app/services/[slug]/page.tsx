import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getServiceBySlug, getAllServiceSlugs, services } from '@/data/services'
import { COMPANY } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SpecTable } from '@/components/ui/SpecTable'
import { Accordion } from '@/components/ui/Accordion'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return {}

  return {
    title: service.metaTitle,
    description: service.metaDescription,
    alternates: {
      canonical: `${COMPANY.url}/services/${slug}`,
    },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: `${COMPANY.url}/services/${slug}`,
      siteName: COMPANY.name,
      type: 'website',
    },
  }
}

const USE_CASES: Record<string, { heading: string; items: { title: string; description: string }[] }> = {
  dryvan: {
    heading: 'When to Rent a DryVan Trailer',
    items: [
      {
        title: 'General Freight & Retail Distribution',
        description:
          'DryVan trailers are the workhorse of the trucking industry. Use them for shipping palletized consumer goods, retail merchandise, food products (non-temperature-sensitive), and e-commerce fulfillment loads across Texas and beyond.',
      },
      {
        title: 'Seasonal Overflow & Peak Demand',
        description:
          'Ramp up capacity during holiday season, back-to-school, or any demand spike without committing to a long-term purchase. Short-term dry van rentals let you flex your fleet when volume surges.',
      },
      {
        title: 'Temporary Storage & Warehousing',
        description:
          'Need extra storage during a facility move, renovation, or inventory overflow? A dry van parked at your dock is a cost-effective portable warehouse that keeps goods secure and weatherproof.',
      },
      {
        title: 'Dedicated Fleet Expansion',
        description:
          'Growing carriers and private fleets can lease dry vans on 6- or 12-month terms to expand capacity without the capital expense of purchasing. Scale your fleet to match contract commitments.',
      },
    ],
  },
  tanker: {
    heading: 'When to Rent a Tanker Trailer',
    items: [
      {
        title: 'Petroleum & Fuel Distribution',
        description:
          'Transport gasoline, diesel, jet fuel, and other petroleum products with DOT-compliant tanker trailers. Multi-compartment units allow delivery of multiple fuel grades in a single trip to gas stations and bulk plants.',
      },
      {
        title: 'Chemical & Industrial Liquid Transport',
        description:
          'Move chemicals, solvents, acids, and industrial liquids safely in stainless steel or specially lined tanker trailers. Our DOT 407 and DOT 412 rated units meet strict hazmat transport requirements.',
      },
      {
        title: 'Oilfield Water Hauling',
        description:
          'Haul produced water, frac water, or fresh water for drilling and completion operations. Tanker trailers are essential for oilfield water logistics in the Permian Basin and Eagle Ford Shale.',
      },
      {
        title: 'Food-Grade Liquid Transport',
        description:
          'Transport milk, juice, edible oils, and other food-grade liquids in sanitary stainless steel tankers. Our food-grade units meet FDA requirements for safe liquid food transport.',
      },
    ],
  },
  flatbed: {
    heading: 'When to Rent a Flatbed Trailer',
    items: [
      {
        title: 'Construction Material Hauling',
        description:
          'Flatbeds are the go-to trailer for lumber, steel beams, concrete products, roofing materials, and building supplies. The open deck allows easy loading with forklifts or cranes from any direction.',
      },
      {
        title: 'Heavy Equipment & Machinery Transport',
        description:
          'Move construction equipment, industrial machinery, generators, and other oversized items. Step deck configurations accommodate taller equipment while staying under standard height limits.',
      },
      {
        title: 'Oil & Gas Pipe and Tubular Hauling',
        description:
          'Transport drill pipe, casing, line pipe, and other oilfield tubulars. Pipe stake and coil package configurations secure cylindrical loads safely for transport to well sites and pipe yards.',
      },
      {
        title: 'Oversized & Wide Load Projects',
        description:
          'When your cargo does not fit inside an enclosed trailer, a flatbed provides the open deck space needed for oversized loads. Pair with proper permits for wide or heavy loads on Texas highways.',
      },
    ],
  },
  'sand-chassis': {
    heading: 'When to Rent a Sand Chassis',
    items: [
      {
        title: 'Hydraulic Fracturing Operations',
        description:
          'Sand chassis are purpose-built for hauling frac sand containers to well sites during completion operations. Quick twist-lock connections allow rapid loading and unloading to keep frac crews supplied with proppant.',
      },
      {
        title: 'Permian Basin & Eagle Ford Shale Jobs',
        description:
          'Operating in Texas oil country? SEEK Equipment provides sand chassis from our Von Ormy, TX yard with convenient access to Eagle Ford operations and delivery to the Permian Basin, Haynesville, and other major shale plays.',
      },
      {
        title: 'Short-Term Completion Job Rentals',
        description:
          'Rent sand chassis for the duration of a specific frac job. Our flexible daily, weekly, and monthly terms align with completion schedules so you only pay for what you need.',
      },
      {
        title: 'Sand Logistics & Last-Mile Delivery',
        description:
          'Support sand transload facilities and last-mile proppant delivery operations. Sand chassis efficiently move standard 20-foot ISO containers and DNS boxes between rail yards, storage sites, and well pads.',
      },
    ],
  },
  'belly-dump': {
    heading: 'When to Rent a Belly Dump Trailer',
    items: [
      {
        title: 'Road Construction & Highway Projects',
        description:
          'Belly dumps are the preferred trailer for laying aggregate base, sub-base, and fill material on road projects. Bottom-discharge gates create consistent windrows while the truck is in motion, speeding up material placement.',
      },
      {
        title: 'Site Development & Earthwork',
        description:
          'Move large volumes of dirt, sand, and gravel for commercial site preparation, residential subdivision grading, and land development projects. High cubic-yard capacity maximizes material moved per trip.',
      },
      {
        title: 'Aggregate & Mining Operations',
        description:
          'Haul crushed stone, limestone, caliche, and other aggregates from quarries and mines to job sites. The Hardox steel tub resists abrasion from sharp, heavy materials for long service life.',
      },
      {
        title: 'Utility & Pipeline Construction',
        description:
          'Supply bedding material, backfill, and select fill for utility trenches and pipeline right-of-way construction. Controlled bottom discharge places material precisely where it is needed along the trench line.',
      },
    ],
  },
}

const serviceImages: Record<string, string> = {
  dryvan: '/images/trailers/dryvan.jpg',
  tanker: '/images/trailers/tanker.jpg',
  flatbed: '/images/trailers/flatbed.jpg',
  'sand-chassis': '/images/trailers/sand-chassis.jpg',
  'belly-dump': '/images/trailers/belly-dump.jpg',
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) notFound()

  const useCases = USE_CASES[slug]
  const relatedServices = services.filter((s) => s.slug !== slug)

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    url: `${COMPANY.url}/services/${slug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY.name,
      telephone: COMPANY.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: COMPANY.address.street,
        addressLocality: COMPANY.address.city,
        addressRegion: COMPANY.address.state,
        postalCode: COMPANY.address.zip,
        addressCountry: COMPANY.address.country,
      },
    },
    areaServed: {
      '@type': 'State',
      name: 'Texas',
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />

      {/* Hero Section */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <Image
          src={serviceImages[slug] ?? '/images/trailers/dryvan.jpg'}
          alt={service.shortTitle}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-brand-blue/80" />
        <Container className="relative z-10">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: service.shortTitle },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <Badge variant="orange">Rental &amp; Leasing</Badge>
            <h1 className="mt-4 text-3xl md:text-5xl font-bold text-white leading-tight">
              {service.title}
            </h1>
            <p className="mt-6 text-lg text-blue-100 leading-relaxed">
              {service.heroDescription}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/quote">
                <Button variant="primary" size="lg">
                  Get a Free Quote
                </Button>
              </Link>
              <a href={COMPANY.phoneHref}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-brand-blue"
                >
                  Call {COMPANY.phone}
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <div className="max-w-4xl">
            <SectionHeading
              title={`${service.shortTitle} Features`}
              subtitle={`Every ${service.shortTitle.toLowerCase()} trailer in our fleet is maintained to the highest standards and comes equipped with the features you need.`}
            />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Specifications Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <Container>
          <div className="max-w-3xl">
            <SectionHeading
              title="Technical Specifications"
              subtitle={`Detailed specs for our ${service.shortTitle.toLowerCase()} fleet. Exact specifications may vary by unit — contact us for availability on specific configurations.`}
            />
            <div className="mt-10 bg-white rounded-xl shadow-md overflow-hidden">
              <SpecTable specs={service.specs} />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              * Specifications are representative of our fleet and may vary by individual unit.
              Contact SEEK Equipment at{' '}
              <a href={COMPANY.phoneHref} className="text-brand-blue hover:underline">
                {COMPANY.phone}
              </a>{' '}
              for details on specific available trailers.
            </p>
          </div>
        </Container>
      </section>

      {/* Use Cases Section */}
      {useCases && (
        <section className="py-16 md:py-24 bg-white">
          <Container>
            <SectionHeading
              title={useCases.heading}
              subtitle={`See how ${COMPANY.name}'s ${service.shortTitle.toLowerCase()} fleet serves businesses across Texas.`}
            />
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {useCases.items.map((useCase) => (
                <Card key={useCase.title}>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {useCase.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto">
            <SectionHeading
              title={`${service.shortTitle} FAQs`}
              subtitle={`Common questions about renting and leasing ${service.shortTitle.toLowerCase()} from ${COMPANY.name}.`}
              centered
            />
            <div className="mt-10">
              <Accordion items={service.faqs} />
            </div>
          </div>
        </Container>
      </section>

      {/* Related Services */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <SectionHeading
            title="Explore Our Other Trailer Types"
            subtitle="SEEK Equipment offers a full fleet of commercial trailers for every hauling need."
            centered
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedServices.map((related) => (
              <Card key={related.slug} hover>
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src={serviceImages[related.slug] ?? '/images/trailers/dryvan.jpg'}
                    alt={related.shortTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2">
                    <Link
                      href={`/services/${related.slug}`}
                      className="hover:text-brand-blue transition-colors"
                    >
                      {related.shortTitle}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {related.heroDescription}
                  </p>
                  <Link
                    href={`/services/${related.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors"
                  >
                    Learn more
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-brand-blue">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Rent a {service.shortTitle.replace(' Trailers', '').replace(' Trailer', '')} Trailer?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Get a no-obligation quote from SEEK Equipment. We offer competitive rates, flexible
              terms, and delivery throughout Texas. Our team is ready to match you with the right
              trailer for your operation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote">
                <Button variant="primary" size="lg">
                  Request a Quote
                </Button>
              </Link>
              <a href={`mailto:${COMPANY.email}`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-brand-blue"
                >
                  Email {COMPANY.email}
                </Button>
              </a>
            </div>
            <p className="mt-6 text-blue-200 text-sm">
              Or call us directly at{' '}
              <a href={COMPANY.phoneHref} className="text-white font-semibold hover:underline">
                {COMPANY.phone}
              </a>
              {' '}&mdash; available Monday through Friday, 8 AM to 5 PM CST.
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
