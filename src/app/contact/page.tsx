import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { ContactForm } from '@/components/forms/ContactForm'
import { MapBox } from '@/components/ui/MapBox'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact SEEK Equipment | Trailer Rental Quotes | Von Ormy TX',
  description:
    'Contact SEEK Equipment for trailer rental and leasing quotes. Located in Von Ormy, TX near San Antonio. Call 1-210-802-0000 or email sales@seekequipment.com.',
  openGraph: {
    title: 'Contact SEEK Equipment | Trailer Rental Quotes | Von Ormy TX',
    description:
      'Contact SEEK Equipment for trailer rental and leasing quotes. Located in Von Ormy, TX near San Antonio. Call 1-210-802-0000 or email sales@seekequipment.com.',
    url: `${COMPANY.url}/contact`,
    type: 'website',
  },
}

export default function ContactPage() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: COMPANY.name,
    url: COMPANY.url,
    description: COMPANY.description,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: COMPANY.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 29.2864,
      longitude: -98.4906,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '12:00',
      },
    ],
    priceRange: '$$',
    image: `${COMPANY.url}/images/seek-equipment-yard.jpg`,
  }

  return (
    <>
      <JsonLd data={localBusinessSchema} />

      {/* Hero */}
      <section className="bg-brand-blue text-white py-16 md:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Contact' },
            ]}
          />
          <h1 className="text-4xl md:text-5xl font-bold mt-4">Contact Us</h1>
          <p className="text-xl text-blue-100 mt-4 max-w-3xl">
            Get in touch with our team for trailer rental quotes, questions, or to schedule a facility visit.
          </p>
        </Container>
      </section>

      {/* Form + Contact Info */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Contact Form */}
            <div className="lg:col-span-2">
              <SectionHeading title="Send Us a Message" />
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            {/* Right: Contact Info */}
            <div>
              <Card className="p-6 md:p-8 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Address</p>
                      <p className="text-gray-600 mt-1">
                        {COMPANY.address.street}
                        <br />
                        {COMPANY.address.city}, {COMPANY.address.state}{' '}
                        {COMPANY.address.zip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Phone</p>
                      <a
                        href={COMPANY.phoneHref}
                        className="text-brand-blue hover:text-brand-blue-dark transition-colors mt-1 block"
                      >
                        {COMPANY.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <a
                        href={`mailto:${COMPANY.email}`}
                        className="text-brand-blue hover:text-brand-blue-dark transition-colors mt-1 block"
                      >
                        {COMPANY.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Business Hours
                      </p>
                      <div className="text-gray-600 mt-1 space-y-1">
                        <p>Mon - Fri: 7:00 AM - 6:00 PM</p>
                        <p>Sat: 8:00 AM - 12:00 PM</p>
                        <p>Sun: Closed</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Response time: Within 2 business hours
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Visit Our Facility */}
      <section className="py-16 md:py-20 bg-gray-50">
        <Container>
          <SectionHeading
            title="Visit Our Facility"
            subtitle="Come see our fleet in person. We are conveniently located off I-35 South, just minutes from downtown San Antonio."
            centered
          />
          <div className="mt-8 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {COMPANY.address.street}
            </p>
            <p className="text-xl text-gray-600 mt-1">
              {COMPANY.address.city}, {COMPANY.address.state}{' '}
              {COMPANY.address.zip}
            </p>
          </div>
          <div className="mt-8 rounded-xl overflow-hidden shadow-md">
            <MapBox
              latitude={29.2864}
              longitude={-98.4906}
              zoom={14}
              markerLabel="SEEK Equipment"
              className="h-80 w-full"
            />
          </div>
        </Container>
      </section>
    </>
  )
}
