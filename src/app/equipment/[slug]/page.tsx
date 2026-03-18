import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServiceBySlug, getAllServiceSlugs, services } from '@/data/services'
import { COMPANY } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SpecTable } from '@/components/ui/SpecTable'
import { Accordion } from '@/components/ui/Accordion'
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
      canonical: `${COMPANY.url}/equipment/${slug}`,
    },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: `${COMPANY.url}/equipment/${slug}`,
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
  'sand-hopper': {
    heading: 'When to Rent a Sand Hopper Trailer',
    items: [
      {
        title: 'Frac Sand Delivery to Well Sites',
        description:
          'Sand hoppers are the workhorse of oilfield proppant logistics. Transport frac sand efficiently from transload facilities and sand mines directly to well sites with rapid gravity discharge for minimal downtime.',
      },
      {
        title: 'Cement & Fly Ash Transport',
        description:
          'Move cement, fly ash, and other dry bulk materials for industrial and construction applications. The hopper design allows controlled discharge at processing facilities and job sites.',
      },
      {
        title: 'Multi-Basin Oilfield Operations',
        description:
          'SEEK Equipment provides sand hoppers for operations across the Permian Basin, Eagle Ford Shale, Bakken Formation, Anadarko Basin, DJ Basin, Powder River Basin, Marcellus Shale, and more.',
      },
      {
        title: 'Dry Bulk Material Logistics',
        description:
          'Support industrial material handling operations with efficient transport of dry bulk commodities. Sand hoppers handle a variety of granular and powdered materials with consistent discharge performance.',
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
  dryvan: '/images/trailers/dry-van-stock.jpg',
  tanker: '/images/trailers/tank-trailer-wellsite.png',
  flatbed: '/images/trailers/flatbed-stock.jpg',
  'sand-chassis': '/images/trailers/sand-chassis-stock.jpg',
  'sand-hopper': '/images/trailers/sand-hopper-wellsite.png',
  'belly-dump': '/images/trailers/belly-dump-seek.png',
}

const APPLICATIONS: Record<string, string[]> = {
  dryvan: ['General Freight', 'Retail Distribution', 'E-Commerce', 'Temporary Storage', 'Consumer Goods'],
  tanker: ['Petroleum Transport', 'Chemical Hauling', 'Oilfield Water', 'Food-Grade Liquids', 'Fuel Distribution'],
  flatbed: ['Construction Materials', 'Heavy Equipment', 'Oilfield Tubulars', 'Oversized Loads', 'Steel & Lumber'],
  'sand-chassis': ['Hydraulic Fracturing', 'Proppant Transport', 'ISO Containers', 'Sand Logistics', 'Oilfield Operations'],
  'sand-hopper': ['Frac Sand Delivery', 'Cement Transport', 'Fly Ash Hauling', 'Dry Bulk Materials', 'Oilfield Proppant'],
  'belly-dump': ['Road Construction', 'Site Development', 'Aggregate Hauling', 'Earthwork', 'Pipeline Construction'],
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) notFound()

  const useCases = USE_CASES[slug]
  const applications = APPLICATIONS[slug] ?? []
  const relatedServices = services.filter((s) => s.slug !== slug)

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    url: `${COMPANY.url}/equipment/${slug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY.name,
      telephone: COMPANY.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: COMPANY.hqAddress.street,
        addressLocality: COMPANY.hqAddress.city,
        addressRegion: COMPANY.hqAddress.state,
        postalCode: COMPANY.hqAddress.zip,
        addressCountry: COMPANY.hqAddress.country,
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

      {/* Hero Section - gradient with faded background image */}
      <section className="relative bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white py-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${serviceImages[slug] ?? '/images/trailers/dry-van-stock.jpg'})` }}
        />
        <div className="relative z-10">
          <Container>
            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Equipment
            </Link>
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold">{service.title}</h1>
              <p className="text-xl text-blue-100 mt-4">{service.heroDescription}</p>
            </div>
          </Container>
        </div>
      </section>

      {/* Main Content - 2-column layout */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* LEFT - Equipment Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={serviceImages[slug] ?? '/images/trailers/dry-van-stock.jpg'}
                alt={service.shortTitle}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* RIGHT - Details */}
            <div className="flex flex-col">
              {/* Overview */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                <p className="mt-4 text-gray-600 leading-relaxed">{service.description}</p>
              </div>

              {/* Key Features */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900">Key Features</h3>
                <ul className="mt-4 space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Applications */}
              {applications.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900">Applications</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {applications.map((app) => (
                      <span
                        key={app}
                        className="px-3 py-1.5 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Box */}
              <div className="mt-8 bg-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Interested in renting or leasing?
                </h3>
                <p className="mt-2 text-gray-600 text-sm">
                  Get a no-obligation quote or call us directly for availability and pricing.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Link href="/quote">
                    <Button variant="primary" size="lg">
                      Get a Free Quote
                    </Button>
                  </Link>
                  <a href={COMPANY.phoneHref}>
                    <Button variant="secondary" size="lg">
                      Call {COMPANY.phone}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Technical Specifications */}
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

      {/* Other Equipment */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <SectionHeading
            title="Other Equipment"
            subtitle="Explore our full fleet of commercial trailers."
            centered
          />
          <div className="mt-12 grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {relatedServices.map((related) => (
              <Link
                key={related.slug}
                href={`/equipment/${related.slug}`}
                className="group bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src={serviceImages[related.slug] ?? '/images/trailers/dry-van-stock.jpg'}
                    alt={related.shortTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-brand-blue transition-colors">
                    {related.shortTitle}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-orange group-hover:text-brand-orange-dark transition-colors">
                    View Details
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
