import Link from 'next/link'
import { differenceInCalendarDays, formatDistanceToNow } from 'date-fns'
import { Clock, FileText, Target, Trash2 } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import DeleteDraftButton from '@/components/dashboard/DeleteDraftButton'
import { getAuth } from '@/lib/auth'
import { DRAFT_ACTIVE_DAYS, DRAFT_TRASH_DAYS, listOwnDrafts, listTrashedDrafts, purgeDueAt, trashDueAt } from '@/lib/writing-drafts'
import { WRITING_TOOLS, isToolId } from '@/lib/writing-tools'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function daysLeft(due: Date) {
  return Math.max(0, differenceInCalendarDays(due, new Date()))
}

export default async function DraftsPage({ searchParams }: { searchParams: { view?: string } }) {
  const session = await getAuth()
  const userId = session?.user?.id
  const showTrash = searchParams.view === 'trash'
  const [drafts, trash] = userId
    ? await Promise.all([listOwnDrafts(userId, 100).catch(() => []), listTrashedDrafts(userId).catch(() => [])])
    : [[], []]
  const list = showTrash ? trash : drafts

  return (
    <div>
      <DashHeader
        eyebrow="Writing tools"
        title="My drafts"
        subtitle={`Drafts stay here for ${DRAFT_ACTIVE_DAYS} days, then move to Trash for ${DRAFT_TRASH_DAYS} more days before they are deleted. Download anything you want to keep.`}
        actions={<Link href="/dashboard/tools" className="btn-primary">New draft</Link>}
      />

      <div role="tablist" aria-label="Draft folders" className="mb-4 inline-flex rounded-xl bg-surface-100 p-1">
        {[
          { href: '/dashboard/tools/drafts', label: 'Active', count: drafts.length, active: !showTrash },
          { href: '/dashboard/tools/drafts?view=trash', label: 'Trash', count: trash.length, active: showTrash },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.href}
            role="tab"
            aria-selected={t.active}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              t.active ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-700 hover:text-ink-900'
            )}
          >
            {t.label} <span className="ml-1 tabular-nums text-ink-500">{t.count}</span>
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="paper-card p-10 text-center">
          {showTrash ? <Trash2 className="h-8 w-8 text-ink-300 mx-auto mb-3" /> : <FileText className="h-8 w-8 text-ink-300 mx-auto mb-3" />}
          <p className="font-semibold text-ink-900">{showTrash ? 'Trash is empty' : 'No drafts yet'}</p>
          <p className="text-sm text-ink-600 mt-1">
            {showTrash
              ? `Drafts you delete, and drafts older than ${DRAFT_ACTIVE_DAYS} days, wait here for ${DRAFT_TRASH_DAYS} days so you can restore them.`
              : 'Generate a CV, SOP, cover letter or email and it will appear here.'}
          </p>
          {!showTrash && <Link href="/dashboard/tools" className="btn-primary mt-5 inline-flex">Open writing tools</Link>}
        </div>
      ) : (
        <ul className="paper-card divide-y divide-surface-100">
          {list.map((d) => {
            const tool = isToolId(d.tool) ? WRITING_TOOLS[d.tool] : null
            if (!tool) return null
            const left = d.trashedAt ? daysLeft(purgeDueAt(d.trashedAt)) : daysLeft(trashDueAt(d.activeSince))
            const urgent = left <= 5
            const name = d.title.replace(`${tool.name}: `, '').replace('Academic CV Builder: ', '')
            const body = (
              <>
                <p className="text-xs font-semibold text-brand-700">{tool.name}</p>
                <p className={cn('font-semibold text-ink-900 truncate', !d.trashedAt && 'group-hover:underline')}>{name}</p>
                <p className="text-xs text-ink-600 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                  Edited {formatDistanceToNow(d.updatedAt, { addSuffix: true })}
                  {d.opportunityId && <><span aria-hidden>·</span><Target className="h-3 w-3" /> Tailored to a listing</>}
                  <span aria-hidden>·</span>
                  <span className={cn('inline-flex items-center gap-1', urgent && 'font-semibold text-amber-700')}>
                    <Clock className="h-3 w-3" />
                    {d.trashedAt
                      ? left === 0 ? 'Deleted today' : `Deleted for good in ${left} day${left === 1 ? '' : 's'}`
                      : left === 0 ? 'Moves to Trash today' : `Moves to Trash in ${left} day${left === 1 ? '' : 's'}`}
                  </span>
                </p>
              </>
            )
            return (
              <li key={d.id} className="flex items-center gap-4 p-4 sm:px-5">
                {d.trashedAt ? (
                  <div className="flex-1 min-w-0">{body}</div>
                ) : (
                  <Link href={`/dashboard/tools/${d.tool}?draft=${d.id}`} className="flex-1 min-w-0 group">{body}</Link>
                )}
                <DeleteDraftButton id={d.id} title={d.title} trashed={!!d.trashedAt} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
