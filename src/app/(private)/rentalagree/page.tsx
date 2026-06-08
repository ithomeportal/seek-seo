import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Equipment Rental Agreement',
  robots: {
    index: false,
    follow: false,
  },
}

// The lease agreement & guaranty are now signed natively inside the Client
// Portal onboarding (requires a signed-in session). This legacy JotForm entry
// point redirects there.
export default function RentalAgreePage() {
  redirect('/client-portal')
}
