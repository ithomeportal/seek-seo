import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

export function CargoSection() {
  return (
    <section className="py-20 bg-gray-50">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div>
            <p className="text-brand-orange font-semibold text-sm tracking-wide uppercase">
              Rentals tailored to your needs
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Keep Your Cargo Moving
            </h2>
            <p className="mt-6 text-gray-600 leading-relaxed">
              SEEK Equipment specializes in trailer rentals and leasing for
              transportation, oil &amp; gas, construction, and logistics companies
              across Texas. Whether you need a single trailer for a week or a
              fleet for a year, we have the right equipment at competitive rates.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              With <strong className="text-gray-900">250+ trailers</strong> at
              your disposal, including DryVan, Tanker, Flatbed, Sand Chassis,
              and Belly Dump configurations, we match you with the perfect
              trailer for your cargo and route.
            </p>
            <div className="mt-8">
              <Link href="/quote">
                <Button variant="primary" size="lg">
                  Request a Quote
                </Button>
              </Link>
            </div>
          </div>

          {/* Image gallery - two stacked photos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/gallery/trailers-loading.jpg"
                alt="Trailers at loading dock"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/gallery/distribution-center.jpg"
                alt="Distribution center with trailers"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
