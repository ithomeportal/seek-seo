'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Phone, Mail, Menu, X, User, Settings } from 'lucide-react'
import { COMPANY, NAV_ITEMS, PORTAL_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const PORTAL_ICONS = {
  User,
  Settings,
} as const

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  function closeMobile() {
    setMobileOpen(false)
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Top bar */}
      <div className="bg-gray-900 text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a
              href={COMPANY.phoneHref}
              className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
            >
              <Phone className="h-3 w-3" />
              {COMPANY.phone}
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="hidden sm:flex items-center gap-1.5 hover:text-white/80 transition-colors"
            >
              <Mail className="h-3 w-3" />
              {COMPANY.email}
            </a>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {PORTAL_LINKS.map((item) => {
              const Icon = PORTAL_ICONS[item.icon as keyof typeof PORTAL_ICONS]
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
                >
                  <Icon className="h-3 w-3" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main nav — sticky */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <nav className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo/logo.png"
              alt="SEEK Equipment Rentals"
              width={180}
              height={60}
              className="h-14 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-semibold transition-colors',
                    active
                      ? 'text-brand-blue bg-brand-blue/5'
                      : 'text-gray-700 hover:text-brand-blue hover:bg-brand-blue/5'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="lg:hidden p-2 text-gray-500 hover:text-brand-blue transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>

        {/* Mobile inline dropdown panel */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
              {/* Nav links */}
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'block px-3 py-2.5 rounded-md text-sm font-semibold transition-colors',
                      active
                        ? 'text-brand-blue bg-brand-blue/5'
                        : 'text-gray-700 hover:text-brand-blue hover:bg-brand-blue/5'
                    )}
                    onClick={closeMobile}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {/* CTA buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-3">
                <Link
                  href="/credit-application"
                  className="block w-full text-center px-5 py-3 border-2 border-brand-blue text-brand-blue font-semibold rounded-xl hover:bg-brand-blue/5 transition-colors text-sm"
                  onClick={closeMobile}
                >
                  Credit Application
                </Link>
                <Link
                  href="/quote"
                  className="block w-full text-center px-5 py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark shadow-lg shadow-brand-orange/20 transition-all duration-300 text-sm"
                  onClick={closeMobile}
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
