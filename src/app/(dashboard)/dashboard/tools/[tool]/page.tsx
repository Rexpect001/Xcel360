import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import { pageCredits } from '@/lib/credits-page'
import WritingToolForm, { type InitialDraft } from '@/components/dashboard/WritingToolForm'
import { WRITING_TOOLS, isToolId } from '@/lib/writing-tools'
import { getAuth } from '@/lib/auth'
import { getOpportunityContext, getOwnDraft, toSummary } from '@/lib/writing-drafts'

export const dynamic = 'force-dynamic'

export default async function WritingToolPage({
  params,
  searchParams,
}: {
  params: { tool: string }
  searchParams: { draft?: string; opportunity?: string }
}) {
  if (!isToolId(params.tool)) notFound()
  const tool = WRITING_TOOLS[params.tool]
  const startup = tool.id.startsWith('startup-')
  const session = await getAuth()
  const userId = session?.user?.id

  let initialDraft: InitialDraft | null = null
  if (userId && searchParams.draft) {
    const d = await getOwnDraft(userId, searchParams.draft).catch(() => null)
    if (d && d.tool === tool.id) {
      const inputs = (d.inputs && typeof d.inputs === 'object' && !Array.isArray(d.inputs) ? d.inputs : {}) as Record<string, string>
      initialDraft = { id: d.id, inputs, output: d.output, hasPrevious: !!d.previousOutput, opportunityId: d.opportunityId }
    }
  }

  const oppId = initialDraft?.opportunityId ?? searchParams.opportunity
  const opp = !startup && oppId ? await getOpportunityContext(oppId) : null
  const credits = await pageCredits(session)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link href={startup ? '/dashboard/launchpad' : '/dashboard/tools'} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
          <ArrowLeft className="h-4 w-4" /> {startup ? 'Back to Launchpad' : 'All writing tools'}
        </Link>
        <Link href="/dashboard/tools/drafts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <FolderOpen className="h-4 w-4" /> My drafts
        </Link>
      </div>
      <DashHeader eyebrow={startup ? 'Launchpad' : 'Writing tools'} title={tool.name} pro subtitle={tool.tagline} />
      <WritingToolForm
        key={initialDraft?.id ?? opp?.id ?? 'new'}
        toolId={tool.id}
        initialDraft={initialDraft}
        opportunity={opp ? toSummary(opp) : null}
        credits={credits}
      />
    </div>
  )
}
