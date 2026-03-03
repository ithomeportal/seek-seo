import { COMPANY } from '@/lib/constants'
import { JsonLd } from './JsonLd'

export function LocalBusinessSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: COMPANY.name,
    description: COMPANY.description,
    url: COMPANY.url,
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
      latitude: 29.2891,
      longitude: -98.6438,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'San Antonio',
      },
      {
        '@type': 'State',
        name: 'Texas',
      },
    ],
    priceRange: '$$',
  }

  return <JsonLd data={data} />
}
