import Link from 'next/link'
import { Coins, Infinity as InfinityIcon, Sparkles } from 'lucide-react'
import { CREDITS_PER_USE, FREE_CREDITS, REFERRAL_CREDITS, usesFor } from '@/lib/billing'
import { cn } from '@/lib/utils'

/**
 * Credit balance strip for the paid AI tools. `credits` null means unlimited (staff).
 * Rendered by server pages and by WritingToolForm, which passes its live balance so
 * the strip updates as soon as a draft is generated.
 */
export default function CreditsNotice({ credits }: { credits: number | null }) {
  if (credits === null) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 shadow-soft">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <InfinityIcon className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-700">
          <span className="font-semibold text-ink-900">Unlimited credits</span> on this staff account.
        </p>
      </div>
    )
  }

  const uses = usesFor(credits)
  const state = uses === 0 ? 'empty' : uses <= 1 ? 'low' : 'ok'
  // Meter is measured against the welcome grant, or the balance if it is bigger
  const pct = Math.min(100, Math.round((credits / Math.max(FREE_CREDITS, credits)) * 100))

  const tone = {
    ok: { box: 'border-surface-200 bg-white', icon: 'bg-brand-50 text-brand-700', bar: 'bg-brand-600' },
    low: { box: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-700', bar: 'bg-amber-600' },
    empty: { box: 'border-red-200 bg-red-50', icon: 'bg-red-100 text-red-700', bar: 'bg-red-600' },
  }[state]

  return (
    <div className={cn('mb-6 rounded-2xl border px-4 py-3.5 shadow-soft', tone.box)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tone.icon)}>
          <Coins className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-ink-900 tabular-nums">{credits.toLocaleString()} credits</span>
            <span className="mx-1.5 text-ink-300" aria-hidden>·</span>
            {state === 'empty' ? (
              <span className="font-semibold text-red-700">Not enough for a new draft</span>
            ) : (
              <span className="font-medium text-ink-800">
                {uses} draft{uses === 1 ? '' : 's'} left
              </span>
            )}
          </p>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
            role="meter"
            aria-label="Credit balance"
            aria-valuemin={0}
            aria-valuemax={Math.max(FREE_CREDITS, credits)}
            aria-valuenow={credits}
          >
            <div className={cn('h-full rounded-full transition-[width] duration-500', tone.bar)} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-600">
            Each new draft uses {CREDITS_PER_USE} credits. Editing, fixing issues and restoring versions are free.
            {state !== 'ok' && (
              <> <Link href="/dashboard/billing#invite" className="font-semibold text-emerald-800 underline underline-offset-2">Invite a friend</Link> and you both get {REFERRAL_CREDITS} free credits.</>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/billing"
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
            state === 'ok' ? 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50' : 'bg-brand-600 text-white hover:bg-brand-700'
          )}
        >
          <Sparkles className="h-4 w-4" />
          {state === 'ok' ? 'Get more credits' : 'Buy credits'}
        </Link>
      </div>
    </div>
  )
}
