import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'

const valueProps = [
  {
    number: '01',
    title: 'Flexible Leasing Solutions',
    description:
      'Daily, weekly, monthly, or long-term lease options tailored to your project timeline and budget.',
  },
  {
    number: '02',
    title: 'Reliable Rental Fleet Provider',
    description:
      'Well-maintained, inspected trailers ready to work. Every unit meets DOT safety standards before delivery.',
  },
  {
    number: '03',
    title: 'Ensuring On-Time Delivery',
    description:
      'We deliver to your site across Texas. From San Antonio to the Permian Basin, we keep your operation moving.',
  },
  {
    number: '04',
    title: 'Smart Value-Added Services',
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
          {valueProps.map((prop) => (
            <div key={prop.number} className="text-center group">
              {/* Large number */}
              <div className="text-5xl font-bold text-brand-orange/20 group-hover:text-brand-orange/40 transition-colors">
                {prop.number}
              </div>

              <h3 className="mt-3 text-lg font-bold text-gray-900">
                {prop.title}
              </h3>

              <p className="mt-3 text-gray-600 leading-relaxed">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
