import { Megaphone } from 'lucide-react'

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
      className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          <h3 className="mt-1 text-sm font-bold text-gray-900">{title}</h3>
          {!compact && <p className="mt-1.5 text-sm leading-6 text-gray-600">{description}</p>}
          <a
            href={href}
            className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            {cta}
          </a>
        </div>
      </div>
    </aside>
  )
}
