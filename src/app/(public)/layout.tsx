import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SessionProvider from '@/components/providers/SessionProvider'
import EdifierAdPopup from '@/components/ui/EdifierAdPopup'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <EdifierAdPopup />
    </SessionProvider>
  )
}
