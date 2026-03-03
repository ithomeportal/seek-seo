import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Facebook, Linkedin, Twitter } from 'lucide-react'
import { COMPANY, NAV_ITEMS } from '@/lib/constants'

const servicesItem = NAV_ITEMS.find((item) => item.label === 'Services')
const serviceLinks =
  servicesItem && 'children' in servicesItem ? servicesItem.children : []

const quickLinks = NAV_ITEMS.map((item) => ({
  label: item.label,
  href: item.href,
}))

const socialLinks = [
  { label: 'Facebook', href: '#', icon: Facebook },
  { label: 'LinkedIn', href: '#', icon: Linkedin },
  { label: 'Twitter', href: '#', icon: Twitter },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Company */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo/logo-dark.png"
                alt="SEEK Equipment Rentals"
                width={160}
                height={53}
                className="h-11 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              {COMPANY.description}
            </p>
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Our Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  {COMPANY.address.full}
                </span>
              </li>
              <li>
                <a
                  href={COMPANY.phoneHref}
                  className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Phone className="h-5 w-5 shrink-0" />
                  {COMPANY.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Mail className="h-5 w-5 shrink-0" />
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; 2026 {COMPANY.name}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-300 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
