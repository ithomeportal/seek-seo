import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ACH Debits Authorization',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AchPage() {
  return (
    <div className="h-[calc(100vh-104px)] md:h-[calc(100vh-140px)]">
      <iframe
        title="SEEK ACH Debits Authorization Form"
        src="https://unilink.jotform.com/sign/241086530827053/invite/01hvsbcrbnc4e70dac26813945?signEmbed=1"
        className="h-full w-full border-0"
        allowTransparency
        allow="geolocation; microphone; camera; fullscreen"
      />
    </div>
  )
}
