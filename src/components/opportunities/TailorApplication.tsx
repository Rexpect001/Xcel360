import Link from 'next/link'
import { Mail, ScrollText, SquareUser, Wand2 } from 'lucide-react'
import { WRITING_TOOLS, toolsForOpportunity, type ToolId } from '@/lib/writing-tools'
import { cn } from '@/lib/utils'

const ICONS: Partial<Record<ToolId, typeof Mail>> = { cv: SquareUser, sop: ScrollText, 'cover-letter': Mail }
const SHORT: Partial<Record<ToolId, string>> = { cv: 'CV', sop: 'Statement of purpose', 'cover-letter': 'Cover letter' }

/** Links into the writing tools with this listing's requirements already filled in. */
export default function TailorApplication({
  opportunityId,
  category,
  className,
}: {
  opportunityId: string
  category: string
  className?: string
}) {
  const tools = toolsForOpportunity(category)
  return (
    <div className={cn('paper-card p-5', className)}>
      <h3 className="font-bold text-ink-900 flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-brand-600" /> Tailor your application
      </h3>
      <p className="text-xs text-ink-500 mt-1 mb-3 leading-relaxed">
        Draft documents written for this listing. We fill in what it asks for; you add your own experience.
      </p>
      <div className="grid gap-2">
        {tools.map((id) => {
          const Icon = ICONS[id] ?? SquareUser
          return (
            <Link
              key={id}
              href={`/dashboard/tools/${id}?opportunity=${opportunityId}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-surface-200 text-sm font-semibold text-ink-700 hover:bg-surface-50 hover:border-brand-200 transition-colors"
              aria-label={`${WRITING_TOOLS[id].name} for this listing`}
            >
              <Icon className="h-4 w-4 text-brand-600" />
              {SHORT[id] ?? WRITING_TOOLS[id].name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
