import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Equipment Rental Agreement',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RentalAgreePage() {
  return (
    <div className="h-[calc(100vh-104px)] md:h-[calc(100vh-140px)]">
      <iframe
        title="EQUIPMENT RENTAL AGREEMENT 2026"
        src="https://unilink.jotform.com/sign/260556428744060/invite/01kje0xazg743258f9ef5cd542?signEmbed=1"
        className="h-full w-full border-0"
        allowTransparency
        allow="geolocation; microphone; camera; fullscreen"
      />
    </div>
  )
}
