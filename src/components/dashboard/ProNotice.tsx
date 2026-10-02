import Link from 'next/link'
import { Sparkles } from 'lucide-react'

/** Shown on Pro pages while Pro features are free during early access. */
export default function ProNotice() {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3">
      <Sparkles className="h-5 w-5 text-accent-600 shrink-0" />
      <p className="text-sm text-ink-700 flex-1">
        <span className="font-semibold text-ink-900">Pro feature, free during early access.</span>{' '}
        Enjoy it now. We will give you plenty of notice before anything changes.
      </p>
      <Link href="/dashboard/pro" className="text-sm font-semibold text-ink-900 underline underline-offset-4 shrink-0">What is in Pro</Link>
    </div>
  )
}
