export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { fail, ok, preflight, withUser } from '@/lib/mobile/http'
import { WRITING_TOOLS, isToolId, opportunityPrefill } from '@/lib/writing-tools'
import { getOpportunityContext, getOwnDraft, latestLaunchpadAnswers, toSummary } from '@/lib/writing-drafts'
import { creditsFor } from '@/lib/billing'

export const OPTIONS = preflight

/**
 * GET one tool's form: its questions, credit cost, and starting answers, from
 * (in order) a saved draft, or the student's profile + an opportunity to tailor to
 * + earlier Launchpad answers. Same prefill rules as the website form.
 */
export async function GET(req: Request, { params }: { params: { tool: string } }) {
  return withUser(req, async (user) => {
    if (!isToolId(params.tool)) return fail('Unknown tool.', 404)
    const tool = WRITING_TOOLS[params.tool]
    const sp = new URL(req.url).searchParams
    const startup = tool.id.startsWith('startup-')

    const draftRow = sp.get('draft') ? await getOwnDraft(user.id, sp.get('draft')) : null
    const draft = draftRow && draftRow.tool === tool.id ? draftRow : null
    const oppRow = !startup ? await getOpportunityContext(draft?.opportunityId ?? sp.get('opportunity')) : null
    const opportunity = oppRow ? toSummary(oppRow) : null

    let values: Record<string, string> = {}
    for (const f of tool.fields) if (f.type === 'select' && f.options) values[f.id] = f.options[0]

    if (draft) {
      const inputs = draft.inputs && typeof draft.inputs === 'object' && !Array.isArray(draft.inputs) ? (draft.inputs as Record<string, string>) : {}
      values = { ...values, ...inputs }
    } else {
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
      const edu = [profile?.degree, profile?.courseOfStudy, profile?.school, profile?.graduationYear].filter(Boolean).join(', ')
      const pre: Record<string, string> = {
        name: user.name ?? '',
        level: profile?.level ?? '',
        course: edu,
        school: edu,
        countries: (profile?.targetCountries ?? []).join(', '),
      }
      for (const f of tool.fields) if (f.prefill && pre[f.prefill]) values[f.id] = pre[f.prefill]
      if (startup) Object.assign(values, await latestLaunchpadAnswers(user.id))
      if (opportunity) Object.assign(values, opportunityPrefill(tool.id, opportunity))
    }

    return ok({
      id: tool.id,
      name: tool.name,
      tagline: tool.tagline,
      outputLabel: tool.outputLabel,
      credits: creditsFor(tool.id),
      fields: tool.fields,
      values,
      opportunity: opportunity ? { id: opportunity.id, title: opportunity.title, org: opportunity.org } : null,
      draft: draft ? { id: draft.id, output: draft.output, hasPrevious: !!draft.previousOutput, updatedAt: draft.updatedAt.toISOString() } : null,
    })
  })
}
