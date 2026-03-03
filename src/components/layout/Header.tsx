'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, Menu, X, ChevronDown, MapPin } from 'lucide-react'
import { COMPANY, NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  function closeMobile() {
    setMobileOpen(false)
    setServicesOpen(false)
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-white shadow-sm'
      )}
    >
      {/* Top bar */}
      <div
        className={cn(
          'hidden md:block bg-brand-blue text-white text-xs transition-all duration-300 overflow-hidden',
          scrolled ? 'max-h-0 py-0' : 'max-h-12 py-2'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
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
              className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
            >
              <Mail className="h-3 w-3" />
              {COMPANY.email}
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-white/70">
            <MapPin className="h-3 w-3" />
            <span>{COMPANY.address.full}</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/images/logo/logo.png"
            alt="SEEK Equipment Rentals"
            width={180}
            height={60}
            className="h-11 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const hasChildren =
              'children' in item && item.children && item.children.length > 0

            if (hasChildren) {
              return (
                <li key={item.label} className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setServicesOpen((prev) => !prev)}
                    onMouseEnter={() => setServicesOpen(true)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-blue font-medium transition-colors"
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        servicesOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {servicesOpen && (
                    <div
                      className="absolute top-full left-0 mt-3 w-56 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2"
                      onMouseLeave={() => setServicesOpen(false)}
                    >
                      <Link
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-blue font-medium transition-colors"
                        onClick={() => setServicesOpen(false)}
                      >
                        All Services
                      </Link>
                      <div className="border-t border-gray-50 my-1" />
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-brand-blue transition-colors"
                          onClick={() => setServicesOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              )
            }

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-gray-600 hover:text-brand-blue font-medium transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/quote"
            className="hidden sm:inline-flex items-center px-5 py-2.5 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark shadow-lg shadow-brand-orange/20 hover:shadow-xl hover:shadow-brand-orange/30 transition-all duration-300 text-sm"
          >
            Get a Quote
          </Link>
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
        </div>
      </nav>

      {/* Mobile slide-out panel */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 top-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMobile}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl overflow-y-auto lg:hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <Image
                src="/images/logo/logo.png"
                alt="SEEK Equipment"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
              <button
                type="button"
                onClick={closeMobile}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-5">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const hasChildren =
                    'children' in item &&
                    item.children &&
                    item.children.length > 0

                  if (hasChildren) {
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="block px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-brand-blue font-medium rounded-lg transition-colors"
                          onClick={closeMobile}
                        >
                          {item.label}
                        </Link>
                        <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="block px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-brand-blue rounded-lg transition-colors"
                                onClick={closeMobile}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  }

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="block px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-brand-blue font-medium rounded-lg transition-colors"
                        onClick={closeMobile}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <Link
                  href="/quote"
                  className="block w-full text-center px-5 py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark shadow-lg shadow-brand-orange/20 transition-all duration-300"
                  onClick={closeMobile}
                >
                  Get a Quote
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-500">
                <a
                  href={COMPANY.phoneHref}
                  className="flex items-center gap-2 hover:text-brand-blue transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {COMPANY.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-center gap-2 hover:text-brand-blue transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {COMPANY.email}
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
