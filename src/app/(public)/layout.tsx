import Script from 'next/script'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PublicSettings from '@/components/layout/PublicSettings'
import SessionProvider from '@/components/providers/SessionProvider'
import { ADSENSE_CLIENT, ADS_ENABLED } from '@/lib/ads'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PublicSettings>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </PublicSettings>
      {/* Public pages only - no ads in the dashboard, admin or auth screens */}
      {ADS_ENABLED && (
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      )}
    </SessionProvider>
  )
}
