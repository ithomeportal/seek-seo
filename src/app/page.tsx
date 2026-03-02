import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { ServiceCards } from '@/components/home/ServiceCards'
import { ValuePropositions } from '@/components/home/ValuePropositions'
import { FleetStats } from '@/components/home/FleetStats'
import { CTABanner } from '@/components/home/CTABanner'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Trailer Rental & Leasing in Texas | SEEK Equipment',
  description:
    'SEEK Equipment offers 250+ trailers for rent and lease in Texas. DryVan, Tanker, Flatbed, Sand Chassis & Belly Dump trailers with flexible terms. Call 1-210-802-0000.',
  openGraph: {
    title: 'Trailer Rental & Leasing in Texas | SEEK Equipment',
    description:
      'SEEK Equipment offers 250+ trailers for rent and lease in Texas. DryVan, Tanker, Flatbed, Sand Chassis & Belly Dump trailers with flexible terms.',
    url: COMPANY.url,
    siteName: COMPANY.name,
    type: 'website',
  },
}

const homepageFaqs = [
  {
    question: 'What types of trailers does SEEK Equipment offer?',
    answer:
      'SEEK Equipment offers five types of trailers for rent and lease: DryVan trailers for general freight, Tanker trailers for liquid transport, Flatbed trailers for oversized loads and construction materials, Sand Chassis trailers for oilfield frac sand hauling, and Belly Dump trailers for aggregate and construction material placement.',
  },
  {
    question: 'How do I get a quote for trailer rental or leasing?',
    answer:
      'You can request a free quote by visiting our quote page, calling us at 1-210-802-0000, or emailing sales@seekequipment.com. Let us know the trailer type, rental duration, and delivery location, and we will provide a competitive quote within one business day.',
  },
  {
    question: 'What areas does SEEK Equipment serve?',
    answer:
      'SEEK Equipment is based in Von Ormy, TX (near San Antonio) and serves all of Texas including the Permian Basin, Eagle Ford Shale, Dallas-Fort Worth, Houston, Austin, and surrounding states. We deliver trailers directly to your job site or facility.',
  },
  {
    question: 'What are the leasing terms available?',
    answer:
      'We offer flexible leasing terms including daily, weekly, monthly, 6-month, and 12-month lease agreements. Long-term leases come with discounted rates. All leases include maintenance support to keep your operations running smoothly.',
  },
  {
    question: 'How large is the SEEK Equipment trailer fleet?',
    answer:
      'Our fleet includes over 250 trailers across five categories: DryVan, Tanker, Flatbed, Sand Chassis, and Belly Dump trailers. All trailers are regularly inspected, well-maintained, and meet DOT safety standards.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homepageFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <HeroSection />
      <ServiceCards />
      <ValuePropositions />
      <FleetStats />
      <CTABanner />
    </>
  )
}
