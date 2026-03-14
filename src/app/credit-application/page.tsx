import type { Metadata } from 'next'
import Image from 'next/image'
import { Phone, Mail, FileText } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Card } from '@/components/ui/Card'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
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

      {/* Hero */}
      <section className="relative text-white py-16 md:py-24 overflow-hidden">
        <Image
          src="/images/about/chassis-yard.jpg"
          alt="SEEK Equipment trailer yard"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-brand-blue/85" />
        <Container className="relative z-10">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Credit Application' },
            ]}
          />
          <div className="flex items-center gap-3 mt-4">
            <FileText className="h-8 w-8 text-white" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Credit Application
            </h1>
          </div>
          <p className="text-xl text-blue-100 mt-4 max-w-3xl">
            Complete the form below to begin the credit approval process. Our
            finance team will review your application and respond within two
            business days.
          </p>
        </Container>
      </section>

      {/* Form + Sidebar */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Form */}
            <div className="lg:col-span-2">
              <SectionHeading title="Business Information" />
              <p className="mt-2 text-gray-600 mb-8">
                Please provide your business details below. All information is
                kept confidential and used solely for credit evaluation purposes.
              </p>
              <CreditApplicationForm />
            </div>

            {/* Right: Info */}
            <div className="space-y-8">
              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  What to Expect
                </h2>
                <ul className="space-y-4 text-gray-700 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                    <span>Submit your credit application</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                    <span>Our finance team reviews your information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                    <span>Receive a response within 2 business days</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                    <span>Select your equipment and begin leasing</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Questions?
                </h2>
                <p className="text-gray-600 mb-6 text-sm">
                  Contact our team for assistance with your credit application.
                </p>
                <div className="space-y-4">
                  <a
                    href={COMPANY.phoneHref}
                    className="flex items-center gap-3 text-brand-blue hover:text-brand-blue-dark font-semibold transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {COMPANY.phone}
                  </a>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="flex items-center gap-3 text-brand-blue hover:text-brand-blue-dark font-semibold transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    {COMPANY.email}
                  </a>
                </div>
              </Card>
            </div>
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
