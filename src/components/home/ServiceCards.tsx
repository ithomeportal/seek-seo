import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'

const equipment = [
  {
    slug: 'sand-chassis',
    title: 'Sand Chassis',
    image: '/images/trailers/sand-chassis-stock.jpg',
    description:
      'Purpose-built chassis designed for transporting frac sand containers to and from well sites.',
  },
  {
    slug: 'belly-dump',
    title: 'Belly Dumps',
    image: '/images/trailers/belly-dump-seek.png',
    description:
      'High-capacity bottom-discharge trailers for efficient bulk material transport and unloading.',
  },
  {
    slug: 'sand-hopper',
    title: 'Sand Hoppers',
    image: '/images/trailers/sand-hopper-wellsite.png',
    description:
      'Specialized trailers for bulk sand and dry material transport with gravity discharge.',
  },
  {
    slug: 'dryvan',
    title: 'Dry Vans',
    image: '/images/trailers/dry-van-stock.jpg',
    description:
      'Enclosed trailers providing secure, weather-protected transport for a wide range of cargo.',
  },
  {
    slug: 'flatbed',
    title: 'Flat Beds',
    image: '/images/trailers/flatbed-stock.jpg',
    description:
      'Open-deck trailers for oversized, heavy, and irregularly shaped cargo requiring crane or forklift loading.',
  },
  {
    slug: 'tanker',
    title: 'Tanks',
    image: '/images/trailers/tank-trailer-wellsite.png',
    description:
      'Aluminum DOT 407 tank trailers for fuel, crude oil, and industrial liquid transport with up to 8,000-gallon capacity.',
  },
]

export function ServiceCards() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Our Equipment
          </h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Six specialized trailer types for transportation, construction, oil
            &amp; gas, and logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <Link
              key={item.slug}
              href={`/equipment/${item.slug}`}
              className="group block bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out"
            >
              {/* Image — no gradient overlay, no title on image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue group-hover:gap-2.5 transition-all duration-300">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
