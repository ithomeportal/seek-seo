import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { Container } from '@/components/ui/Container'
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
        description="Complete the form below to begin the credit approval process. Our team will review your application and respond within two business days."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Credit Application' },
        ]}
        icon={<FileText className="h-8 w-8 text-white" />}
      />

      {/* Form Section */}
      <section className="bg-background py-12">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border p-6 md:p-10 shadow-sm">
              <CreditApplicationForm />
            </div>
            <p className="mt-6 text-center text-xs text-gray-500 max-w-2xl mx-auto">
              All information provided is kept confidential and used solely for
              credit evaluation purposes. A copy of your completed application will
              be emailed to the signatory address you provide.
            </p>
          </div>
        </Container>
      </section>
    </>
  )
}
