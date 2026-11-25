import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'
import { PRIVACY } from '@/content/legal'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
  description:
    'How Xcel360 collects, uses, stores, and protects your personal data - and the rights you have over it.',
}

export default function PrivacyPolicyPage() {
  return <LegalPage doc={PRIVACY} icon="privacy" />
}
