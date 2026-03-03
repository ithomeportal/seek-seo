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
    title: 'Reliable Rental Fleet',
    description:
      'Well-maintained, inspected trailers ready to work. Every unit meets DOT safety standards before delivery.',
  },
  {
    number: '03',
    title: 'On-Time Delivery',
    description:
      'We deliver to your site across Texas. From San Antonio to the Permian Basin, we keep your operation moving.',
  },
  {
    number: '04',
    title: 'Value-Added Services',
    description:
      'Dedicated team with decades of industry experience. Get the right equipment recommendation every time.',
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

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {valueProps.map((prop) => (
            <div
              key={prop.number}
              className="relative pl-6 border-l-2 border-gray-100 hover:border-brand-orange transition-colors duration-300 group"
            >
              {/* Number */}
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-brand-orange/30 to-brand-orange/10 group-hover:from-brand-orange/50 group-hover:to-brand-orange/20 transition-all duration-300 leading-none">
                {prop.number}
              </span>

              <h3 className="mt-3 text-base font-bold text-gray-900 tracking-tight">
                {prop.title}
              </h3>

              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
