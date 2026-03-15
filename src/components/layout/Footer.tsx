import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin } from 'lucide-react'
import { COMPANY, NAV_ITEMS } from '@/lib/constants'

const equipmentItem = NAV_ITEMS.find((item) => item.label === 'Equipment')
const equipmentLinks =
  equipmentItem && 'children' in equipmentItem ? equipmentItem.children : []

const quickLinks = NAV_ITEMS.map((item) => ({
  label: item.label,
  href: item.href,
}))

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Company */}
          <div>
            <Link href="/" className="inline-block bg-white p-3 rounded-lg">
              <Image
                src="/images/logo/logo.png"
                alt="SEEK Equipment Rentals"
                width={140}
                height={47}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400/80">
              {COMPANY.description}
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
                    className="text-sm text-gray-400/80 hover:text-brand-orange transition-colors duration-200"
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
                    className="text-sm text-gray-400/80 hover:text-brand-orange transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                <div className="text-sm text-gray-400/80 leading-relaxed">
                  <p className="font-medium text-gray-300">HQ Office</p>
                  <p>{COMPANY.hqAddress.full}</p>
                  <p className="font-medium text-gray-300 mt-2">Trailer Yard</p>
                  <p>{COMPANY.address.full}</p>
                </div>
              </li>
              <li>
                <a
                  href={COMPANY.phoneHref}
                  className="flex items-center gap-3 group"
                >
                  <Phone className="h-4 w-4 text-brand-orange shrink-0" />
                  <span className="text-sm text-gray-400/80 group-hover:text-white transition-colors duration-200">
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
                  <span className="text-sm text-gray-400/80 group-hover:text-white transition-colors duration-200">
                    {COMPANY.email}
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>&copy; 2026 {COMPANY.name}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-gray-300 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-300 transition-colors duration-200"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
