import { Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdSlotProps = {
  placement: string
  compact?: boolean
}

export default function AdSlot({ placement, compact = false }: AdSlotProps) {
  const href = process.env.NEXT_PUBLIC_AD_URL ?? '/resources'
  const label = process.env.NEXT_PUBLIC_AD_LABEL ?? 'Sponsored'
  const title = process.env.NEXT_PUBLIC_AD_TITLE ?? 'Need a stronger scholarship application?'
  const description = process.env.NEXT_PUBLIC_AD_DESCRIPTION ?? 'Explore Xcel360 resources, templates, and guides built for applicants.'
  const cta = process.env.NEXT_PUBLIC_AD_CTA ?? 'View resources'

  return (
    <aside
      aria-label={`${label} placement: ${placement}`}
      className="rounded-2xl border border-surface-200 bg-white p-4 sm:p-5 shadow-soft"
    >
      <div className={compact ? 'flex flex-col sm:flex-row sm:items-center gap-4' : 'flex flex-col gap-1'}>
        <div className={compact ? 'flex items-center gap-3 min-w-0 flex-1' : 'flex items-start gap-3 min-w-0 flex-1'}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
            <h3 className="mt-0.5 text-sm sm:text-base font-bold text-ink-900">{title}</h3>
            {!compact && <p className="mt-1.5 text-sm leading-6 text-ink-500">{description}</p>}
          </div>
        </div>
        <a
          href={href}
          className={cn(
            'inline-flex shrink-0 min-h-10 items-center justify-center rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-800 whitespace-nowrap',
            compact ? 'w-full sm:w-auto' : 'mt-3'
          )}
        >
          {cta}
        </a>
      </div>
    </aside>
  )
}
