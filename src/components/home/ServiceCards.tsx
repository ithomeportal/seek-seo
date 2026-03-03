import Link from 'next/link'
import Image from 'next/image'
import { services } from '@/data/services'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

const serviceImages: Record<string, string> = {
  dryvan: '/images/trailers/dryvan.jpg',
  tanker: '/images/trailers/tanker.jpg',
  flatbed: '/images/trailers/flatbed-highway.png',
  'sand-chassis': '/images/trailers/sand-chassis.jpg',
  'belly-dump': '/images/trailers/belly-dump.jpg',
}

export function ServiceCards() {
  return (
    <section className="py-24 bg-gray-50/50">
      <Container className="max-w-[90rem]">
        <SectionHeading
          title="Our Trailer Fleet"
          subtitle="Five specialized trailer types for transportation, construction, oil & gas, and logistics."
          centered
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group block bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 ease-out"
            >
              {/* Image with overlay */}
              <div className="relative h-52 lg:h-68 overflow-hidden">
                <Image
                  src={serviceImages[service.slug] ?? '/images/trailers/dryvan.jpg'}
                  alt={service.shortTitle}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/10 to-transparent" />

                {/* Floating title on image */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {service.shortTitle}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                  {service.description}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange group-hover:gap-2.5 transition-all duration-300">
                  Learn More
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
