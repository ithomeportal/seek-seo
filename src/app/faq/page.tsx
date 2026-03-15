import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Accordion } from '@/components/ui/Accordion'
import { Button } from '@/components/ui/Button'
import { PageHero } from '@/components/layout/PageHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { faqCategories, getAllFaqs } from '@/data/faqs'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Trailer Rental FAQs | SEEK Equipment',
  description:
    'Find answers to common questions about trailer rental, leasing, pricing, trailer types, maintenance, and compliance at SEEK Equipment in Von Ormy, TX.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Trailer Rental FAQs | SEEK Equipment',
    description:
      'Find answers to common questions about trailer rental, leasing, pricing, trailer types, maintenance, and compliance at SEEK Equipment in Von Ormy, TX.',
    url: `${COMPANY.url}/faq`,
    type: 'website',
  },
}

export default function FaqPage() {
  const allFaqs = getAllFaqs()

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <JsonLd data={faqPageSchema} />

      <PageHero
        title="Frequently Asked Questions"
        description="Everything you need to know about renting and leasing trailers from SEEK Equipment."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'FAQ' },
        ]}
      />

      {/* Intro */}
      <section className="py-16 md:py-20">
        <Container>
          <p className="text-lg text-gray-700 max-w-4xl">
            Below you will find answers to the most common questions our customers ask
            about our trailer rental process, pricing, available trailer types,
            maintenance policies, and compliance requirements. If you do not see the
            answer you are looking for, please{' '}
            <Link
              href="/contact"
              className="text-brand-blue hover:text-brand-blue-dark font-medium transition-colors"
            >
              contact us
            </Link>{' '}
            directly.
          </p>

          {/* FAQ Categories */}
          <div className="mt-12 space-y-16">
            {faqCategories.map((category) => (
              <div key={category.slug} id={category.slug}>
                <SectionHeading title={category.category} />
                <div className="mt-6">
                  <Accordion items={category.faqs} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-16 md:py-20 bg-gray-50">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Still Have Questions?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our team is happy to help. Get in touch and we will get back to you
              within 2 business hours.
            </p>
            <div className="mt-8">
              <Link href="/contact">
                <Button variant="primary" size="lg">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
