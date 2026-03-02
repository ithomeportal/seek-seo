import { Settings, Shield, Truck, Headphones } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

const valueProps = [
  {
    icon: Settings,
    title: 'Flexible Leasing',
    description:
      'Daily, weekly, monthly, or long-term lease options tailored to your project timeline and budget.',
  },
  {
    icon: Shield,
    title: 'Reliable Fleet',
    description:
      'Well-maintained, inspected trailers ready to work. Every unit meets DOT safety standards before delivery.',
  },
  {
    icon: Truck,
    title: 'On-Time Delivery',
    description:
      'We deliver to your site across Texas. From San Antonio to the Permian Basin, we keep your operation moving.',
  },
  {
    icon: Headphones,
    title: 'Expert Support',
    description:
      'Dedicated team with decades of industry experience. Get the right equipment recommendation every time.',
  },
]

export function ValuePropositions() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionHeading
          title="Why Choose SEEK Equipment"
          subtitle="On the move solutions for your business"
          centered
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {valueProps.map((prop) => {
            const Icon = prop.icon
            return (
              <div key={prop.title} className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-brand-blue" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  {prop.title}
                </h3>

                <p className="mt-3 text-gray-600 leading-relaxed">
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
