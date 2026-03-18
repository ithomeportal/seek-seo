import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
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
        description="Find answers to common questions about our rental services, equipment, and policies. For additional inquiries, please contact our team directly."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'FAQ' },
        ]}
      />

      {/* FAQ Categories */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            {faqCategories.map((category) => (
              <div key={category.slug} id={category.slug}>
                <h2 className="text-2xl font-bold text-gray-900 pb-3 border-b-2 border-brand-blue/20">
                  {category.category}
                </h2>
                <div className="mt-4 bg-white rounded-xl border border-gray-200">
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
              Our team is ready to assist you with any additional questions about
              our equipment and services.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <Button variant="primary" size="lg">
                  Contact Us
                </Button>
              </Link>
              <a href={COMPANY.phoneHref}>
                <Button variant="secondary" size="lg">
                  {COMPANY.phone}
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
