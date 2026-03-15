import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { PageHero } from '@/components/layout/PageHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'
import { CreditApplicationForm } from '@/components/forms/CreditApplicationForm'

export const metadata: Metadata = {
  title: 'Credit Application | SEEK Equipment',
  description:
    'Apply for credit with SEEK Equipment to lease trailers. Complete our simple credit application form and our finance team will respond within two business days.',
  alternates: { canonical: '/credit-application' },
  openGraph: {
    title: 'Credit Application | SEEK Equipment',
    description:
      'Apply for credit with SEEK Equipment to lease trailers. Complete our simple credit application form and our finance team will respond within two business days.',
    url: `${COMPANY.url}/credit-application`,
    type: 'website',
  },
}

export default function CreditApplicationPage() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Credit Application',
    provider: {
      '@type': 'LocalBusiness',
      name: COMPANY.name,
      url: COMPANY.url,
      telephone: COMPANY.phone,
      email: COMPANY.email,
    },
    description:
      'Credit application for trailer leasing from SEEK Equipment.',
  }

  return (
    <>
      <JsonLd data={serviceSchema} />

      <PageHero
        title="Credit Application"
        description="Complete the form below to begin the credit approval process. Our finance team will review your application and respond within two business days."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Credit Application' },
        ]}
        icon={<FileText className="h-8 w-8 text-white" />}
      />

      {/* Form */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="max-w-2xl mx-auto">
            <SectionHeading title="Business Information" centered />
            <p className="mt-2 text-gray-600 mb-8 text-center">
              Please provide your business details below. All information is
              kept confidential and used solely for credit evaluation purposes.
            </p>
            <CreditApplicationForm />
          </div>
        </Container>
      </section>

      <section className="py-12 bg-gray-50">
        <Container>
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By submitting this application, you authorize SEEK Equipment
              Rentals to verify the information provided and conduct a credit
              evaluation.
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
