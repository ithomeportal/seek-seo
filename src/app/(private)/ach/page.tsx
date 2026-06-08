import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'ACH Debits Authorization',
  robots: {
    index: false,
    follow: false,
  },
}

// The ACH authorization is now signed natively inside the Client Portal
// onboarding (requires a signed-in session). This legacy JotForm entry point
// redirects there.
export default function AchPage() {
  redirect('/client-portal')
}
