import { COMPANY } from '@/lib/constants'
import { JsonLd } from './JsonLd'

export function LocalBusinessSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${COMPANY.url}/#organization`,
    name: COMPANY.name,
    description: COMPANY.description,
    url: COMPANY.url,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    image: `${COMPANY.url}/images/logo/logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.hqAddress.street,
      addressLocality: COMPANY.hqAddress.city,
      addressRegion: COMPANY.hqAddress.state,
      postalCode: COMPANY.hqAddress.zip,
      addressCountry: COMPANY.hqAddress.country,
    },
    location: [
      {
        '@type': 'Place',
        name: 'SEEK Equipment HQ',
        address: {
          '@type': 'PostalAddress',
          streetAddress: COMPANY.hqAddress.street,
          addressLocality: COMPANY.hqAddress.city,
          addressRegion: COMPANY.hqAddress.state,
          postalCode: COMPANY.hqAddress.zip,
          addressCountry: COMPANY.hqAddress.country,
        },
      },
      {
        '@type': 'Place',
        name: 'SEEK Equipment Trailer Yard',
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
      },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '08:00',
        closes: '12:00',
      },
    ],
    areaServed: [
      {
        '@type': 'City',
        name: 'San Antonio',
        '@id': 'https://en.wikipedia.org/wiki/San_Antonio',
      },
      {
        '@type': 'City',
        name: 'Von Ormy',
      },
      {
        '@type': 'State',
        name: 'Texas',
      },
      {
        '@type': 'Place',
        name: 'Eagle Ford Shale',
      },
      {
        '@type': 'Place',
        name: 'Permian Basin',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Trailer Rental & Leasing Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Dry Van Trailer Rental & Leasing',
            url: `${COMPANY.url}/services/dryvan`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Tanker Trailer Rental & Leasing',
            url: `${COMPANY.url}/services/tanker`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Flatbed Trailer Rental & Leasing',
            url: `${COMPANY.url}/services/flatbed`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Sand Chassis Trailer Rental & Leasing',
            url: `${COMPANY.url}/services/sand-chassis`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Belly Dump Trailer Rental & Leasing',
            url: `${COMPANY.url}/services/belly-dump`,
          },
        },
      ],
    },
    sameAs: [],
    priceRange: '$$',
  }

  return <JsonLd data={data} />
}
