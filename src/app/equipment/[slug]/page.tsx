import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServiceBySlug, getAllServiceSlugs, services } from '@/data/services'
import { COMPANY } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/seo/JsonLd'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return {}

  const title = `${service.title} Trailer Rental & Leasing | SEEK Equipment`
  const description = service.description

  return {
    title,
    description,
    alternates: {
      canonical: `${COMPANY.url}/equipment/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${COMPANY.url}/equipment/${slug}`,
      siteName: COMPANY.name,
      type: 'website',
    },
  }
}

const SERVICE_IMAGES: Record<string, string> = {
  'sand-chassis': '/images/trailers/sand-chassis-stock.jpg',
  'belly-dumps': '/images/trailers/belly-dump-seek.png',
  'sand-hoppers': '/images/trailers/sand-hopper-wellsite.png',
  'dry-vans': '/images/trailers/dry-van-stock.jpg',
  flatbeds: '/images/trailers/flatbed-stock.jpg',
  tanks: '/images/trailers/tank-trailer-wellsite.png',
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) notFound()

  const relatedServices = services.filter((s) => s.slug !== slug)
  const heroImage = SERVICE_IMAGES[slug] ?? '/images/trailers/dry-van-stock.jpg'

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.overview || service.description,
    url: `${COMPANY.url}/equipment/${slug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY.name,
      telephone: COMPANY.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: COMPANY.hqAddress.street,
        addressLocality: COMPANY.hqAddress.city,
        addressRegion: COMPANY.hqAddress.state,
        postalCode: COMPANY.hqAddress.zip,
        addressCountry: COMPANY.hqAddress.country,
      },
    },
    areaServed: {
      '@type': 'State',
      name: 'Texas',
    },
  }

  return (
    <>
      <JsonLd data={serviceSchema} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-orange to-brand-orange/90 text-white py-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative z-10">
          <Container>
            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 text-orange-200 hover:text-white transition-colors text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Equipment
            </Link>
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold">{service.title}</h1>
              <p className="text-xl text-orange-100 mt-4">{service.heroDescription}</p>
            </div>
          </Container>
        </div>
      </section>

      {/* Overview + Features + Applications + CTA */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <div className="max-w-3xl">
            {/* Overview */}
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              {service.overview || service.description}
            </p>

            {/* Key Features */}
            <h3 className="mt-10 text-lg font-bold text-gray-900">Key Features</h3>
            <ul className="mt-4 space-y-3">
              {service.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Applications */}
            {service.applications && service.applications.length > 0 && (
              <>
                <h3 className="mt-10 text-lg font-bold text-gray-900">Applications</h3>
                <ul className="mt-4 space-y-3">
                  {service.applications.map((app) => (
                    <li key={app} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{app}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* CTA */}
            <div className="mt-10 bg-gray-100 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Interested in renting or leasing?
              </h3>
              <p className="mt-2 text-gray-600">
                Contact our team to discuss availability, rates, and flexible rental terms
                for our {service.title.toLowerCase()} fleet.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link href="/quote">
                  <Button variant="primary" size="lg">
                    Get a Quote
                  </Button>
                </Link>
                <a href={COMPANY.phoneHref}>
                  <Button variant="secondary" size="lg">
                    {COMPANY.phone}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Other Equipment */}
      <section className="py-16 md:py-24 bg-gray-50">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900 text-center">Other Equipment</h2>
          <div className="mt-12 grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {relatedServices.map((related) => (
              <Link
                key={related.slug}
                href={`/equipment/${related.slug}`}
                className="group bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src={SERVICE_IMAGES[related.slug] ?? '/images/trailers/dry-van-stock.jpg'}
                    alt={related.shortTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-brand-blue transition-colors">
                    {related.shortTitle}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-orange group-hover:text-brand-orange-dark transition-colors">
                    View Details
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
