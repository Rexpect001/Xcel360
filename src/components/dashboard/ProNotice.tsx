import Link from 'next/link'
import { Sparkles } from 'lucide-react'

/** Early access notice shared by guided tools and resources. */
export default function ProNotice() {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3">
      <Sparkles className="h-5 w-5 text-accent-600 shrink-0" />
      <p className="text-sm text-ink-700 flex-1">
        <span className="font-semibold text-ink-900">Free during early access.</span>{' '}
        Use the tools, edit the drafts, and tell us what would help you next.
      </p>
      <Link href="/dashboard/launchpad" className="text-sm font-semibold text-ink-900 underline underline-offset-4 shrink-0">Explore Launchpad</Link>
    </div>
  )
}
