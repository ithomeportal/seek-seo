import { Shield, Clock, Truck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

const valueProps = [
  {
    icon: Shield,
    title: 'DOT Inspected Fleet',
    description:
      'Every trailer is DOT-inspected and road-ready before delivery. GPS tracking on every unit for real-time visibility.',
  },
  {
    icon: Clock,
    title: 'Flexible Leasing Terms',
    description:
      'Daily, weekly, monthly, or long-term lease options tailored to your project timeline and budget. No rigid contracts.',
  },
  {
    icon: Truck,
    title: 'Nationwide Delivery',
    description:
      'Power only units deliver across the continental United States. From San Antonio to the Permian Basin and beyond.',
  },
]

export function ValuePropositions() {
  return (
    <section className="py-24 bg-white">
      <Container>
        <SectionHeading
          title="Why Choose SEEK Equipment"
          subtitle="On the move solutions for your business"
          centered
        />

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {valueProps.map((prop) => {
            const Icon = prop.icon
            return (
              <div key={prop.title} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center mx-auto">
                  <Icon className="w-5 h-5 text-brand-blue" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900 tracking-tight">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
