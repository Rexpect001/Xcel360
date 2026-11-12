import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Target } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import DeleteDraftButton from '@/components/dashboard/DeleteDraftButton'
import { getAuth } from '@/lib/auth'
import { listOwnDrafts } from '@/lib/writing-drafts'
import { WRITING_TOOLS, isToolId } from '@/lib/writing-tools'

export const dynamic = 'force-dynamic'

export default async function DraftsPage() {
  const session = await getAuth()
  const drafts = session?.user?.id ? await listOwnDrafts(session.user.id, 100).catch(() => []) : []

  return (
    <div>
      <DashHeader
        eyebrow="Writing tools"
        title="My drafts"
        subtitle="Every draft you generate is saved here, with your edits. Open one to keep working on it."
        actions={<Link href="/dashboard/tools" className="btn-primary">New draft</Link>}
      />

      {drafts.length === 0 ? (
        <div className="paper-card p-10 text-center">
          <FileText className="h-8 w-8 text-ink-300 mx-auto mb-3" />
          <p className="font-semibold text-ink-800">No drafts yet</p>
          <p className="text-sm text-ink-500 mt-1">Generate a CV, SOP, cover letter or email and it will appear here.</p>
          <Link href="/dashboard/tools" className="btn-primary mt-5 inline-flex">Open writing tools</Link>
        </div>
      ) : (
        <ul className="paper-card divide-y divide-surface-100">
          {drafts.map((d) => {
            const tool = isToolId(d.tool) ? WRITING_TOOLS[d.tool] : null
            if (!tool) return null
            return (
              <li key={d.id} className="flex items-center gap-4 p-4 sm:px-5">
                <Link href={`/dashboard/tools/${d.tool}?draft=${d.id}`} className="flex-1 min-w-0 group">
                  <p className="text-xs font-semibold text-brand-700">{tool.name}</p>
                  <p className="font-semibold text-ink-900 truncate group-hover:underline">{d.title.replace(`${tool.name}: `, '')}</p>
                  <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1.5">
                    Edited {formatDistanceToNow(d.updatedAt, { addSuffix: true })}
                    {d.opportunityId && <><span aria-hidden>·</span><Target className="h-3 w-3" /> Tailored to a listing</>}
                  </p>
                </Link>
                <DeleteDraftButton id={d.id} title={d.title} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
