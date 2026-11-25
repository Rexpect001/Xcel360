import { Suspense } from 'react'
import type { Metadata } from 'next'
import UnsubscribeContent from './UnsubscribeContent'

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <UnsubscribeContent />
    </Suspense>
  )
}
