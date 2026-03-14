import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { ServiceCards } from '@/components/home/ServiceCards'
import { ValuePropositions } from '@/components/home/ValuePropositions'
import { CargoSection } from '@/components/home/CargoSection'
import { FleetStats } from '@/components/home/FleetStats'
import { CTABanner } from '@/components/home/CTABanner'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Trailer Leasing & Rental in Texas | SEEK Equipment',
  description:
    'SEEK Equipment offers 250+ trailers for lease and rent in Texas. DryVan, Tanker, Flatbed, Sand Chassis, Sand Hopper & Belly Dump trailers with flexible terms. Call 1-210-802-0000.',
  openGraph: {
    title: 'Trailer Leasing & Rental in Texas | SEEK Equipment',
    description:
      'SEEK Equipment offers 250+ trailers for lease and rent in Texas. DryVan, Tanker, Flatbed, Sand Chassis, Sand Hopper & Belly Dump trailers with flexible terms.',
    url: COMPANY.url,
    siteName: COMPANY.name,
    type: 'website',
  },
}

const homepageFaqs = [
  {
    question: 'What types of trailers does SEEK Equipment offer?',
    answer:
      'SEEK Equipment offers six types of trailers for lease and rent: DryVan trailers for general freight, Tanker trailers for liquid transport, Flatbed trailers for oversized loads and construction materials, Sand Chassis trailers for oilfield frac sand hauling, Sand Hopper trailers for dry bulk material transport, and Belly Dump trailers for aggregate and construction material placement.',
  },
  {
    question: 'How do I get a quote for trailer rental or leasing?',
    answer:
      'You can request a free quote by visiting our quote page, calling us at 1-210-802-0000, or emailing sales@seekequipment.com. Let us know the trailer type, rental duration, and delivery location, and we will provide a competitive quote within one business day.',
  },
  {
    question: 'What areas does SEEK Equipment serve?',
    answer:
      'SEEK Equipment serves the continental United States, with a strong presence in the Permian Basin, Eagle Ford Shale, Bakken Formation, Anadarko Basin, DJ Basin, Powder River Basin, Marcellus Shale, and the San Antonio metropolitan area. We deliver via power only units to any location across the lower 48 states.',
  },
  {
    question: 'What are the leasing terms available?',
    answer:
      'We offer flexible lease agreements tailored to your specific project requirements. Our team will work with you to structure terms that align with your operational timeline and business needs. Every trailer is DOT inspected and road-ready before delivery.',
  },
  {
    question: 'How large is the SEEK Equipment trailer fleet?',
    answer:
      'Our fleet includes over 250 trailers across six categories: DryVan, Tanker, Flatbed, Sand Chassis, Sand Hopper, and Belly Dump trailers. All trailers are DOT inspected before each rental and meet federal safety standards.',
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
      <CargoSection />
      <FleetStats />
      <CTABanner />
    </>
  )
}
