import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import SessionProvider from '@/components/providers/SessionProvider'
import EdifierAdPopup from '@/components/ui/EdifierAdPopup'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <EdifierAdPopup />
    </SessionProvider>
  )
}
