import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Building2 } from 'lucide-react'
import { COMPANY } from '@/lib/constants'

const equipmentLinks = [
  { label: 'Sand Chassis', href: '/equipment/sand-chassis' },
  { label: 'Belly Dumps', href: '/equipment/belly-dumps' },
  { label: 'Sand Hoppers', href: '/equipment/sand-hoppers' },
  { label: 'Dry Vans', href: '/equipment/dry-vans' },
  { label: 'Flat Beds', href: '/equipment/flatbeds' },
  { label: 'Tanks', href: '/equipment/tanks' },
]

const quickLinks = [
  { label: 'Equipment for Sale', href: '/for-sale' },
  { label: 'Get a Quote', href: '/quote' },
  { label: 'Credit Application', href: '/credit-application' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact Us', href: '/contact' },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Company */}
          <div>
            <Link href="/" className="inline-block bg-white p-3 rounded-lg">
              <Image
                src="/images/logo/logo.png"
                alt="SEEK Equipment Rentals"
                width={160}
                height={48}
                className="h-12 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400/80">
              Premier trailer leasing services serving the energy,
              construction, and transportation industries across Texas and
              beyond.
            </p>
          </div>

          {/* Column 2: Equipment */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
              Equipment
            </h3>
            <ul className="space-y-3">
              {equipmentLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400/80 hover:text-brand-blue transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400/80 hover:text-brand-blue transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={COMPANY.phoneHref}
                  className="flex items-center gap-3 group"
                >
                  <Phone className="h-4 w-4 text-brand-orange shrink-0" />
                  <span className="text-sm text-gray-400/80 group-hover:text-brand-blue transition-colors duration-200">
                    {COMPANY.phone}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-center gap-3 group"
                >
                  <Mail className="h-4 w-4 text-brand-orange shrink-0" />
                  <span className="text-sm text-gray-400/80 group-hover:text-brand-blue transition-colors duration-200">
                    {COMPANY.email}
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400/80 leading-relaxed">
                  <p className="text-xs text-white/60 uppercase tracking-wider">
                    HQ Office
                  </p>
                  <p>{COMPANY.hqAddress.full}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400/80 leading-relaxed">
                  <p className="text-xs text-white/60 uppercase tracking-wider">
                    Trailer Yard
                  </p>
                  <p>{COMPANY.address.full}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <p>&copy; {new Date().getFullYear()} SEEK Equipment Rentals. All rights reserved.</p>
          <Link
            href="/admin"
            className="hover:text-white/50 transition-colors duration-200"
          >
            Internal Portal
          </Link>
        </div>
      </div>
    </footer>
  )
}
