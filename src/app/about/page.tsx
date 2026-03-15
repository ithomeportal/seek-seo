import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHero } from '@/components/layout/PageHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About SEEK Equipment | Texas Trailer Rental Experts',
  description:
    'Learn about SEEK Equipment, a leading trailer rental and leasing company in Von Ormy, TX. 250+ trailers serving San Antonio, Eagle Ford Shale, Permian Basin, and all of Texas.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About SEEK Equipment | Texas Trailer Rental Experts',
    description:
      'Learn about SEEK Equipment, a leading trailer rental and leasing company in Von Ormy, TX. 250+ trailers serving San Antonio, Eagle Ford Shale, Permian Basin, and all of Texas.',
    url: `${COMPANY.url}/about`,
    type: 'website',
  },
}

const values = [
  {
    title: 'Safety First',
    description:
      'Every trailer in our fleet undergoes rigorous DOT inspection before each rental. We meet or exceed all DOT and FMCSA safety standards so you can focus on your operations with confidence.',
    icon: (
      <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Customer Focus',
    description:
      'We build lasting relationships with our clients by understanding their unique hauling requirements. Our dedicated account managers provide personalized service and fast response times.',
    icon: (
      <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Reliability',
    description:
      'With 250+ DOT-inspected trailers and a strategic location on the I-35 corridor, we deliver consistent availability and rapid deployment. Every unit has GPS tracking for real-time visibility.',
    icon: (
      <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    title: 'Flexibility',
    description:
      'From daily rentals to 12-month leases, we offer terms that fit your project timeline and budget. Need to scale up or switch trailer types mid-contract? We make it easy.',
    icon: (
      <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
]

const serviceAreas = [
  'San Antonio Metro',
  'South Texas',
  'Houston Corridor',
  'Austin',
  'Laredo & Border Region',
  'Permian Basin',
  'Eagle Ford Shale',
]

export default function AboutPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    url: COMPANY.url,
    description: COMPANY.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.hqAddress.street,
      addressLocality: COMPANY.hqAddress.city,
      addressRegion: COMPANY.hqAddress.state,
      postalCode: COMPANY.hqAddress.zip,
      addressCountry: COMPANY.hqAddress.country,
    },
    telephone: COMPANY.phone,
    email: COMPANY.email,
    areaServed: serviceAreas.map((area) => ({
      '@type': 'Place',
      name: area,
    })),
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 10,
      maxValue: 50,
    },
  }

  return (
    <>
      <JsonLd data={organizationSchema} />

      <PageHero
        title="About SEEK Equipment"
        description="Your trusted partner for trailer rental and leasing in Texas"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'About' },
        ]}
      />

      {/* Our Story / Mission / Strategy 2030 — 3-column grid */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {/* Our Story */}
            <div className="relative p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Our Story</h2>
              </div>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  SEEK Equipment is a leading trailer rental and leasing company headquartered in
                  Von Ormy, Texas, just south of San Antonio. We have built a fleet of over 250
                  trailers including DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump units.
                </p>
                <p>
                  Our strategic location on the I-35 corridor provides easy access to the major
                  freight arteries connecting San Antonio, Austin, Dallas, Houston, and the
                  Laredo border crossing — with strong coverage in South Texas, the
                  Eagle Ford Shale region, and the Permian Basin.
                </p>
                <p>
                  What sets us apart is our commitment to personalized service and rapid
                  turnaround. We respond to quote requests within two business hours and work
                  directly with each customer to recommend the right trailer type.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="relative p-8 rounded-2xl bg-brand-blue text-white shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold">Our Mission</h2>
              </div>
              <div className="space-y-4 text-sm text-white/80 leading-relaxed">
                <p>
                  To provide reliable, flexible trailer rental and leasing solutions that keep
                  businesses moving.
                </p>
                <p>
                  We are committed to maintaining the highest safety standards,
                  delivering exceptional customer service, and offering competitive pricing that
                  helps our clients succeed in a demanding marketplace.
                </p>
                <p>
                  Our clients span the transportation, oil and gas, construction, and logistics
                  industries — and we take pride in keeping their operations moving with
                  DOT-inspected, road-ready equipment.
                </p>
              </div>
            </div>

            {/* Strategy 2030 */}
            <div className="relative p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Strategy 2030</h2>
              </div>
              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  As Texas continues to grow as one of the nation&apos;s busiest logistics and energy
                  hubs, SEEK Equipment is investing in a bold vision for the next chapter.
                </p>
                <p>
                  Our Strategy 2030 plan focuses on expanding our fleet to 500+ trailers,
                  diversifying into specialty equipment for emerging industries, and establishing
                  satellite yards in key markets including Houston, Laredo, and the Permian Basin.
                </p>
                <p>
                  We are also investing in technology — online quoting, digital contracts, and
                  GPS-enabled fleet tracking — to make renting a trailer as simple and transparent
                  as possible.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Service Areas */}
      <section className="py-16 md:py-20 bg-brand-blue">
        <Container>
          <SectionHeading
            title="Service Areas"
            subtitle="Serving key regions across Texas with reliable trailer rental and leasing"
            centered
            light
          />
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {serviceAreas.map((area) => (
              <div
                key={area}
                className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 px-4 py-3 text-center font-medium text-white shadow-sm"
              >
                {area}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeading
            title="Our Values"
            subtitle="The principles that guide everything we do at SEEK Equipment"
            centered
          />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <Card key={value.title} className="p-6 text-center">
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-brand-blue text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Work With Us?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Get in touch to discuss your trailer rental and leasing needs.
              Our team is ready to help.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button variant="white" size="lg">
                  Contact Us
                </Button>
              </Link>
              <Link href="/quote">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white hover:text-brand-blue border">
                  Request a Quote
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
