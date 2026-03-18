import { Shield, Clock, Truck } from 'lucide-react'
import { Container } from '@/components/ui/Container'

const valueProps = [
  {
    icon: Shield,
    title: 'Reliable Fleet',
    description:
      'Well-maintained equipment inspected before every lease',
  },
  {
    icon: Clock,
    title: 'Flexible Terms',
    description:
      'Customizable lease agreements tailored to your project scope and timeline',
  },
  {
    icon: Truck,
    title: 'Delivery Available',
    description:
      'We deliver and pick up across Texas',
  },
]

export function ValuePropositions() {
  return (
    <section className="py-12 bg-gray-50 border-y border-gray-100">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valueProps.map((prop) => {
            const Icon = prop.icon
            return (
              <div
                key={prop.title}
                className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    {prop.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                    {prop.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
