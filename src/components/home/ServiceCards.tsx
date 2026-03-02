import Link from 'next/link'
import { services } from '@/data/services'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

const serviceIcons: Record<string, string> = {
  dryvan: '\uD83D\uDE9A',
  tanker: '\uD83D\uDEE2\uFE0F',
  flatbed: '\uD83D\uDEFB',
  'sand-chassis': '\u2699\uFE0F',
  'belly-dump': '\uD83D\uDEA7',
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
              <div className="h-2 bg-brand-orange" />
              <div className="p-6">
                <div className="w-14 h-14 rounded-lg bg-brand-blue/10 flex items-center justify-center text-2xl mb-4">
                  {serviceIcons[service.slug] ?? '\uD83D\uDE9A'}
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  {service.shortTitle}
                </h3>

                <p className="mt-3 text-gray-600 leading-relaxed">
                  {service.description.length > 100
                    ? `${service.description.slice(0, 100)}...`
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
