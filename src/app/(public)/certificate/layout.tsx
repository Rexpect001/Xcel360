import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Your Event Certificate',
  description: 'Attended an Xcel360 event? Enter the email you registered with to find, download and print your certificate of participation.',
  alternates: { canonical: '/certificate' },
}

export default function CertificateLayout({ children }: { children: React.ReactNode }) {
  return children
}
