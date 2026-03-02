'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Phone, Mail, Menu, X, ChevronDown, MapPin } from 'lucide-react'
import { COMPANY, NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)

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

  const servicesItem = NAV_ITEMS.find((item) => item.label === 'Services')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div className="hidden md:block bg-[#35668d] text-white text-sm">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a
              href={COMPANY.phoneHref}
              className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              {COMPANY.phone}
            </a>
            <a
              href={`mailto:${COMPANY.email}`}
              className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {COMPANY.email}
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-gray-200">
            <MapPin className="h-3.5 w-3.5" />
            <span>{COMPANY.address.full}</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[#35668d] hover:text-[#2a5170] transition-colors"
        >
          SEEK Equipment
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
                    className="flex items-center gap-1 text-gray-700 hover:text-[#35668d] font-medium transition-colors"
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        servicesOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {servicesOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2"
                      onMouseLeave={() => setServicesOpen(false)}
                    >
                      <Link
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#35668d] font-medium transition-colors"
                        onClick={() => setServicesOpen(false)}
                      >
                        All Services
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#35668d] transition-colors"
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
                  className="text-gray-700 hover:text-[#35668d] font-medium transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-4">
          <Link
            href="/quote"
            className="hidden sm:inline-flex items-center px-5 py-2.5 bg-[#ee5519] text-white font-semibold rounded-lg hover:bg-[#d44a14] transition-colors text-sm"
          >
            Get a Quote
          </Link>
          <button
            type="button"
            className="lg:hidden p-2 text-gray-700 hover:text-[#35668d] transition-colors"
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
            className="fixed inset-0 top-0 bg-black/40 z-40 lg:hidden"
            onClick={closeMobile}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl overflow-y-auto lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="text-lg font-bold text-[#35668d]">Menu</span>
              <button
                type="button"
                onClick={closeMobile}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4">
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
                          className="block px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#35668d] font-medium rounded-lg transition-colors"
                          onClick={closeMobile}
                        >
                          {item.label}
                        </Link>
                        <ul className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#35668d] rounded-lg transition-colors"
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
                        className="block px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#35668d] font-medium rounded-lg transition-colors"
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
                  className="block w-full text-center px-5 py-3 bg-[#ee5519] text-white font-semibold rounded-lg hover:bg-[#d44a14] transition-colors"
                  onClick={closeMobile}
                >
                  Get a Quote
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                <a
                  href={COMPANY.phoneHref}
                  className="flex items-center gap-2 hover:text-[#35668d] transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {COMPANY.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-center gap-2 hover:text-[#35668d] transition-colors"
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
