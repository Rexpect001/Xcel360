import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'
import { TERMS } from '@/content/legal'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms for using Xcel360: what we provide, your account, acceptable use, content ownership, certificates and verification, and our liability limits.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <LegalPage doc={TERMS} icon="terms" />
}
