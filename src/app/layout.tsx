import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Xcel360 — Scholarships, Mentorship & Deadline Tracking',
  description: 'Discover scholarships, track applications, manage deadlines, and get mentorship — all in one place.',
  keywords: ['scholarships', 'fully funded', 'study abroad', 'mentorship', 'deadline tracker'],
  openGraph: {
    title: 'Xcel360 — Funding, mentorship, and a clear plan.',
    description: 'Discover scholarships, track deadlines, and get guided support.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  )
}
