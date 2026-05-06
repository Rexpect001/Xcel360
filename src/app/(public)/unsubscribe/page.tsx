import { Suspense } from 'react'
import UnsubscribeContent from './UnsubscribeContent'

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <UnsubscribeContent />
    </Suspense>
  )
}
