import Link from 'next/link'
import { ArrowUpRight, SquareUser, ScrollText, Mail, Send, FolderOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DashHeader from '@/components/dashboard/DashHeader'
import CreditsNotice from '@/components/dashboard/CreditsNotice'
import { pageCredits } from '@/lib/credits-page'
import { WRITING_TOOLS, TOOL_ORDER, isToolId } from '@/lib/writing-tools'
import { getAuth } from '@/lib/auth'
import { listOwnDrafts } from '@/lib/writing-drafts'

export const dynamic = 'force-dynamic'

const ICONS = { cv: SquareUser, sop: ScrollText, 'cover-letter': Mail, 'cold-email': Send } as const

export default async function ToolsIndexPage() {
  const session = await getAuth()
  const recent = session?.user?.id ? await listOwnDrafts(session.user.id, 4).catch(() => []) : []
  const credits = await pageCredits(session)
  return (
    <div>
      <DashHeader
        eyebrow="Materials"
        title="Writing tools"
        pro
        subtitle="Draft the documents every application asks for. Each tool uses only what you tell it, so the result sounds like you."
      />
      <CreditsNotice credits={credits} />
      <div className="grid sm:grid-cols-2 gap-4">
        {TOOL_ORDER.map((id) => {
          const t = WRITING_TOOLS[id]
          const Icon = ICONS[id]
          return (
            <Link key={id} href={`/dashboard/tools/${id}`} className="group paper-card p-6 hover:border-ink-200 hover:shadow-premium transition-all">
              <div className="flex items-start justify-between">
                <span className="w-11 h-11 rounded-xl bg-brand-600 text-accent-200 flex items-center justify-center"><Icon className="h-5 w-5" /></span>
                <ArrowUpRight className="h-5 w-5 text-ink-200 group-hover:text-ink-700 transition-colors" />
              </div>
              <h2 className="mt-5 font-bold text-lg text-ink-900">{t.name}</h2>
              <p className="text-sm text-ink-500 mt-1 leading-relaxed">{t.tagline}</p>
            </Link>
          )
        })}
      </div>

      {recent.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-ink-900">Recent drafts</h2>
            <Link href="/dashboard/tools/drafts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
              <FolderOpen className="h-4 w-4" /> All drafts
            </Link>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {recent.map((d) => isToolId(d.tool) && (
              <li key={d.id}>
                <Link href={`/dashboard/tools/${d.tool}?draft=${d.id}`} className="block paper-card p-4 hover:border-ink-200 transition-colors">
                  <p className="text-xs font-semibold text-brand-700">{WRITING_TOOLS[d.tool].name}</p>
                  <p className="font-semibold text-ink-900 truncate">{d.title.replace(`${WRITING_TOOLS[d.tool].name}: `, '')}</p>
                  <p className="text-xs text-ink-400 mt-0.5">Edited {formatDistanceToNow(d.updatedAt, { addSuffix: true })}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
