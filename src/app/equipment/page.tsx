import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { services } from '@/data/services'
import { COMPANY } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/layout/PageHero'
import { JsonLd } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Trailer Rental & Leasing Equipment | SEEK Equipment',
  description:
    'Explore SEEK Equipment\'s full fleet of rental trailers: DryVan, Tanker, Flatbed, Sand Chassis, Sand Hopper, and Belly Dump trailers. Flexible short-term and long-term leasing in Texas. Call 1-210-802-0000.',
  alternates: { canonical: '/equipment' },
}

const SERVICE_IMAGES: Record<string, string> = {
  'sand-chassis': '/images/trailers/sand-chassis-stock.jpg',
  'belly-dumps': '/images/trailers/belly-dump-seek.png',
  'sand-hoppers': '/images/trailers/sand-hopper-wellsite.png',
  'dry-vans': '/images/trailers/dry-van-stock.jpg',
  flatbeds: '/images/trailers/flatbed-stock.jpg',
  tanks: '/images/trailers/tank-trailer-wellsite.png',
}

// MANUS design order
const DISPLAY_ORDER = ['sand-chassis', 'belly-dumps', 'sand-hoppers', 'dry-vans', 'flatbeds', 'tanks']

export default function EquipmentPage() {
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
        url: `${COMPANY.url}/equipment/${service.slug}`,
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

      <PageHero
        title="Our Equipment"
        description="SEEK Equipment Rentals maintains a diverse fleet of specialized trailers to serve the energy, construction, and transportation industries. Each unit is regularly inspected and maintained to ensure peak performance."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Equipment' },
        ]}
      />

      <section className="bg-background py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...services].sort((a, b) => DISPLAY_ORDER.indexOf(a.slug) - DISPLAY_ORDER.indexOf(b.slug)).map((service) => (
              <Link
                key={service.slug}
                href={`/equipment/${service.slug}`}
                className="group bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={SERVICE_IMAGES[service.slug] ?? '/images/trailers/dry-van-stock.jpg'}
                    alt={service.shortTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900">
                    {service.title}
                  </h2>
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed flex-1">
                    {service.description}
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-brand-blue group-hover:text-brand-orange transition-colors">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
