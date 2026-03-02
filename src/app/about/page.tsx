import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About SEEK Equipment | Texas Trailer Rental Experts',
  description:
    'Learn about SEEK Equipment, a leading trailer rental and leasing company in Von Ormy, TX. 250+ trailers serving San Antonio, Eagle Ford Shale, Permian Basin, and all of Texas.',
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
      'Every trailer in our fleet undergoes rigorous inspection and maintenance before each rental. We meet or exceed all DOT and FMCSA safety standards so you can focus on your operations with confidence.',
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
      'With 250+ well-maintained trailers and a strategic location on the I-35 corridor, we deliver consistent availability and rapid deployment. When you need a trailer, we have you covered.',
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
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: COMPANY.address.country,
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

      {/* Hero */}
      <section className="bg-brand-blue text-white py-16 md:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'About' },
            ]}
          />
          <h1 className="text-4xl md:text-5xl font-bold mt-4">
            About SEEK Equipment
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mt-4 max-w-3xl">
            Your trusted partner for trailer rental and leasing in Texas
          </p>
        </Container>
      </section>

      {/* Company Story */}
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeading title="Our Story" />
          <div className="mt-8 space-y-6 text-gray-700 text-lg leading-relaxed max-w-4xl">
            <p>
              SEEK Equipment is a leading trailer rental and leasing company headquartered in
              Von Ormy, Texas, just south of San Antonio. Founded to serve the growing demand
              for reliable trailer solutions across Texas, we have built a fleet of over 250
              trailers including DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump units.
              Our clients span the transportation, oil and gas, construction, and logistics
              industries, and we take pride in keeping their operations moving with
              well-maintained, road-ready equipment.
            </p>
            <p>
              Our strategic location on the I-35 corridor provides easy access to the major
              freight arteries connecting San Antonio, Austin, Dallas, Houston, and the
              Laredo border crossing. This positioning allows us to serve clients across the
              entire state efficiently, with particularly strong coverage in South Texas, the
              Eagle Ford Shale region, and the Permian Basin. Whether you need a single
              flatbed for a short-term construction project or a fleet of tankers for ongoing
              oilfield operations, SEEK Equipment delivers.
            </p>
            <p>
              What sets us apart is our commitment to personalized service and rapid
              turnaround. We understand that downtime costs money, which is why we maintain
              our fleet to the highest standards and respond to quote requests within two
              business hours. Our team works directly with each customer to understand their
              hauling requirements, recommend the right trailer type, and structure rental or
              lease terms that fit their budget and timeline.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-20 bg-gray-50">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <SectionHeading
              title="Our Mission"
              centered
            />
            <p className="mt-8 text-xl text-gray-700 leading-relaxed">
              To provide reliable, flexible trailer rental and leasing solutions that keep
              businesses moving. We are committed to maintaining the highest safety standards,
              delivering exceptional customer service, and offering competitive pricing that
              helps our clients succeed in a demanding marketplace.
            </p>
          </div>
        </Container>
      </section>

      {/* Strategy 2030 */}
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeading title="Strategy 2030" />
          <div className="mt-8 space-y-6 text-gray-700 text-lg leading-relaxed max-w-4xl">
            <p>
              As Texas continues to grow as one of the nation&apos;s busiest logistics and energy
              hubs, SEEK Equipment is investing in a bold vision for the next chapter. Our
              Strategy 2030 plan focuses on expanding our fleet to 500+ trailers,
              diversifying into specialty equipment for emerging industries, and establishing
              satellite yards in key markets including Houston, Laredo, and the Permian Basin.
            </p>
            <p>
              We are also investing in technology to streamline the rental process, from
              online quoting and digital contracts to GPS-enabled fleet tracking. Our goal is
              to make renting a trailer as simple and transparent as possible while
              maintaining the personal relationships and hands-on service our customers
              value.
            </p>
          </div>
        </Container>
      </section>

      {/* Service Areas */}
      <section className="py-16 md:py-20 bg-gray-50">
        <Container>
          <SectionHeading
            title="Service Areas"
            subtitle="Serving key regions across Texas with reliable trailer rental and leasing"
            centered
          />
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {serviceAreas.map((area) => (
              <div
                key={area}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center font-medium text-gray-800 shadow-sm"
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
                <Button variant="primary" size="lg">
                  Contact Us
                </Button>
              </Link>
              <Link href="/quote">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand-blue">
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
