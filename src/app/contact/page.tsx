import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { ContactForm } from '@/components/forms/ContactForm'
import { PageHero } from '@/components/layout/PageHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact SEEK Equipment | Trailer Rental Quotes | Von Ormy TX',
  description:
    'Contact SEEK Equipment for trailer rental and leasing quotes. Located in Von Ormy, TX near San Antonio. Call 1-210-802-0000 or email info@seekequipment.com.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact SEEK Equipment | Trailer Rental Quotes | Von Ormy TX',
    description:
      'Contact SEEK Equipment for trailer rental and leasing quotes. Located in Von Ormy, TX near San Antonio. Call 1-210-802-0000 or email info@seekequipment.com.',
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
      streetAddress: COMPANY.hqAddress.street,
      addressLocality: COMPANY.hqAddress.city,
      addressRegion: COMPANY.hqAddress.state,
      postalCode: COMPANY.hqAddress.zip,
      addressCountry: COMPANY.hqAddress.country,
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

      <PageHero
        title="Contact Us"
        description="Get in touch with our team to discuss your equipment needs, request a quote, or learn more about our rental and leasing services."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Contact' },
        ]}
      />

      {/* Contact Info + Form */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Get in Touch
              </h2>
              <div className="space-y-6">
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
                    <MapPin className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">HQ Office</p>
                    <p className="text-gray-600 mt-1">
                      {COMPANY.hqAddress.street}
                      <br />
                      {COMPANY.hqAddress.city}, {COMPANY.hqAddress.state}{' '}
                      {COMPANY.hqAddress.zip}
                    </p>
                    <p className="font-semibold text-gray-900 mt-3">
                      Trailer Yard
                    </p>
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
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Send Us a Message
                </h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
