import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LocalBusinessSchema } from '@/components/seo/LocalBusinessSchema'
import { COMPANY } from '@/lib/constants'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | SEEK Equipment',
    default: 'SEEK Equipment | Trailer Rental & Leasing in Texas',
  },
  description: COMPANY.description,
  metadataBase: new URL(COMPANY.url),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: COMPANY.url,
    siteName: COMPANY.name,
    title: 'SEEK Equipment | Trailer Rental & Leasing in Texas',
    description: COMPANY.description,
    images: [
      {
        url: '/images/hero/hero-bg.jpg',
        width: 1920,
        height: 1080,
        alt: 'SEEK Equipment — Trailer Rental & Leasing in Texas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEEK Equipment | Trailer Rental & Leasing in Texas',
    description: COMPANY.description,
    images: ['/images/hero/hero-bg.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'theme-color': '#35668d',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LocalBusinessSchema />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
