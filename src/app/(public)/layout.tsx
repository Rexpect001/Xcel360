import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PublicSettings from '@/components/layout/PublicSettings'
import SessionProvider from '@/components/providers/SessionProvider'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PublicSettings>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </PublicSettings>
    </SessionProvider>
  )
}
