import Link from 'next/link'
import { Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Credit balance strip for the paid AI tools. `credits` null means unlimited (staff). */
export default function CreditsNotice({ credits }: { credits: number | null }) {
  const low = credits !== null && credits <= 1
  return (
    <div
      className={cn(
        'mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border px-4 py-3',
        low ? 'border-amber-200 bg-amber-50' : 'border-accent-200 bg-accent-50'
      )}
    >
      <Coins className={cn('h-5 w-5 shrink-0', low ? 'text-amber-600' : 'text-accent-600')} />
      <p className="text-sm text-ink-700 flex-1">
        {credits === null ? (
          <><span className="font-semibold text-ink-900">Unlimited credits</span> on this staff account.</>
        ) : (
          <>
            <span className="font-semibold text-ink-900">{credits} credit{credits === 1 ? '' : 's'} left.</span>{' '}
            Each new draft uses 1 credit. Editing, fixing issues and restoring versions are free.
          </>
        )}
      </p>
      {credits !== null && (
        <Link href="/dashboard/billing" className="text-sm font-semibold text-ink-900 underline underline-offset-4 shrink-0">
          {low ? 'Buy credits' : 'Get more credits'}
        </Link>
      )}
    </div>
  )
}
