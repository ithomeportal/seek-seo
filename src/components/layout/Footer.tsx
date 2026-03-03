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
    <footer className="bg-[#0f1a24] text-gray-300">
      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12">
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
            <p className="mt-4 text-sm leading-relaxed text-gray-400/80">
              {COMPANY.description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-gray-400 hover:bg-brand-orange hover:text-white transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wide mb-5">
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

          {/* Column 3: Our Services */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wide mb-5">
              Our Services
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="text-sm text-gray-400/80 hover:text-brand-orange transition-colors duration-200"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wide mb-5">
              Contact Info
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-brand-orange" />
                </div>
                <span className="text-sm text-gray-400/80 leading-relaxed">
                  {COMPANY.address.full}
                </span>
              </li>
              <li>
                <a
                  href={COMPANY.phoneHref}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shrink-0 group-hover:bg-brand-orange/20 transition-colors duration-200">
                    <Phone className="h-4 w-4 text-brand-orange" />
                  </div>
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
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 shrink-0 group-hover:bg-brand-orange/20 transition-colors duration-200">
                    <Mail className="h-4 w-4 text-brand-orange" />
                  </div>
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
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
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
