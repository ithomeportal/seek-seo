import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rental Application',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RentalAppPage() {
  return (
    <div className="h-[calc(100vh-104px)] md:h-[calc(100vh-140px)]">
      <iframe
        title="SEEK EQUIPMENT RENTAL APPLICATION"
        src="https://unilink.jotform.com/sign/241085762971059/invite/01hvsaw73t4342f6a1212af6f7?signEmbed=1"
        className="h-full w-full border-0"
        allowTransparency
        allow="geolocation; microphone; camera; fullscreen"
      />
    </div>
  )
}
