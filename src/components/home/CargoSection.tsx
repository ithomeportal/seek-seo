import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

export function CargoSection() {
  return (
    <section className="py-24 bg-gray-50/50 overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-brand-orange" />
              <p className="text-brand-orange font-semibold text-xs tracking-[0.2em] uppercase">
                Rentals tailored to your needs
              </p>
            </div>

            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Keep Your Cargo
              <br />
              <span className="text-brand-blue">Moving</span>
            </h2>

            <p className="mt-6 text-gray-500 leading-relaxed">
              SEEK Equipment specializes in trailer rentals and leasing for
              transportation, oil &amp; gas, construction, and logistics companies
              across Texas. Whether you need a single trailer for a week or a
              fleet for a year, we have the right equipment.
            </p>

            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-brand-orange">250+</span>
                <span className="text-sm text-gray-500 leading-tight">
                  Trailers
                  <br />
                  Available
                </span>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-brand-blue">5</span>
                <span className="text-sm text-gray-500 leading-tight">
                  Trailer
                  <br />
                  Types
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/quote">
                <Button variant="primary" size="lg">
                  Request a Quote
                </Button>
              </Link>
            </div>
          </div>

          {/* Overlapping image gallery */}
          <div className="relative">
            {/* Main image */}
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/gallery/trailers-loading.jpg"
                alt="American flatbed trailer on highway with mountains"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Offset smaller image */}
            <div className="absolute -bottom-8 -left-6 w-48 h-36 rounded-xl overflow-hidden shadow-lg border-4 border-white">
              <Image
                src="/images/gallery/distribution-center.jpg"
                alt="Belly dump trailer at oilfield at night"
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>

            {/* Decorative accent */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-brand-orange/20 rounded-2xl -z-10" />
          </div>
        </div>
      </Container>
    </section>
  )
}
