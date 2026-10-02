import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'react-hot-toast'

// Brand type: Plus Jakarta Sans for headings, Inter for body/UI - both chosen
// for readability at small sizes on a high-traffic information site.
const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const display = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-display', weight: ['500', '600', '700', '800'] })

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'Xcel360  -  Scholarships, Mentorship & Deadline Tracking',
    template: '%s  -  Xcel360',
  },
  description:
    'Xcel360 helps African students discover fully funded scholarships, track application deadlines, connect with mentors, and build a clear plan to study abroad.',
  keywords: [
    'scholarships for Africans',
    'fully funded scholarships',
    'study abroad scholarships',
    'scholarship deadlines',
    'Nigerian scholarships',
    'undergraduate scholarships',
    'postgraduate scholarships',
    'PhD scholarships',
    'mentorship for students',
    'scholarship tracker',
    'Xcel360',
  ],
  authors: [{ name: 'Xcel360', url: BASE }],
  creator: 'Xcel360',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE,
    siteName: 'Xcel360',
    title: 'Xcel360  -  Scholarships, Mentorship & Deadline Tracking',
    description:
      'Discover fully funded scholarships, track deadlines, and get mentorship to study abroad  -  all in one place for African students.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Xcel360  -  Scholarships & Mentorship Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xcel360  -  Scholarships, Mentorship & Deadline Tracking',
    description:
      'Discover fully funded scholarships, track deadlines, and get mentorship to study abroad.',
    images: ['/og-image.png'],
    creator: '@Xcel_360',
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
  alternates: {
    canonical: BASE,
  },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: '/apple-icon.png',
  },
  verification: {
    google: 'HqtM8s2pElCiihxma2gV07HWCRTF8hM4J6AZ9gPGaW0',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        <meta name="theme-color" content="#2266b1" />
        {ADSENSE_CLIENT && <meta name="google-adsense-account" content={ADSENSE_CLIENT} />}
      </head>
      <body className="font-sans">
        {children}
        {ADSENSE_CLIENT && (
          <Script
            id="adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  )
}
