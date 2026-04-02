'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'

const EXCLUDED_PREFIXES = ['/admin', '/client-portal']

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideShell = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))

  if (hideShell) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
