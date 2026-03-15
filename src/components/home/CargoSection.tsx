import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'

const benefits = [
  '250+ DOT-inspected trailers ready to deploy',
  'GPS tracking on every unit for real-time visibility',
  'Flexible daily, weekly, monthly, and long-term leases',
  'Power only delivery across the continental United States',
  'Dedicated account managers with industry expertise',
  'Fast turnaround — most quotes within 2 hours',
]

export function CargoSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-brand-orange" />
              <p className="text-brand-orange font-semibold text-xs tracking-[0.2em] uppercase">
                Why choose SEEK
              </p>
            </div>

            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Keep Your Cargo
              <br />
              <span className="text-brand-blue">Moving</span>
            </h2>

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Image with floating overlay */}
          <div className="relative">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/gallery/trailers-loading.jpg"
                alt="American flatbed trailer on highway with mountains"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Floating overlay box */}
            <div className="absolute -bottom-6 -right-6 bg-brand-blue text-white rounded-xl p-6 shadow-lg max-w-[200px]">
              <p className="text-3xl font-extrabold">250+</p>
              <p className="text-sm text-white/80 mt-1">Trailers Ready to Deploy</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
