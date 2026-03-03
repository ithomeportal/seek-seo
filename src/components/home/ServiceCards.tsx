import Link from 'next/link'
import Image from 'next/image'
import { services } from '@/data/services'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

const serviceImages: Record<string, string> = {
  dryvan: '/images/trailers/dryvan.jpg',
  tanker: '/images/trailers/tanker.jpg',
  flatbed: '/images/trailers/flatbed.jpg',
  'sand-chassis': '/images/trailers/sand-chassis.jpg',
  'belly-dump': '/images/trailers/belly-dump.jpg',
}

export function ServiceCards() {
  return (
    <section className="py-20 bg-gray-50">
      <Container>
        <SectionHeading
          title="Our Trailer Fleet"
          subtitle="Specialized equipment for every need"
          centered
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.slug} hover>
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={serviceImages[service.slug] ?? '/images/trailers/dryvan.jpg'}
                  alt={service.shortTitle}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow-lg">
                  {service.shortTitle}
                </span>
              </div>
              <div className="p-6">
                <p className="text-gray-600 leading-relaxed">
                  {service.description.length > 120
                    ? `${service.description.slice(0, 120)}...`
                    : service.description}
                </p>

                <Link
                  href={`/services/${service.slug}`}
                  className="mt-4 inline-flex items-center text-brand-blue font-semibold hover:text-brand-orange transition-colors"
                >
                  Learn More
                  <span className="ml-1" aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}
