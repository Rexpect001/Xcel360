import { cn } from '@/lib/utils'

interface DashHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  pro?: boolean
  actions?: React.ReactNode
  className?: string
}

/** Consistent page heading for every dashboard and admin screen. */
export default function DashHeader({ eyebrow, title, subtitle, pro, actions, className }: DashHeaderProps) {
  return (
    <header className={cn('mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl sm:text-[2.1rem] text-ink-900 flex items-center gap-3">
          {title}
          {pro && <span className="pro-badge !text-[11px] !px-2 !py-1">PRO</span>}
        </h1>
        {subtitle && <p className="text-ink-500 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
