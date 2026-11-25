export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { json, preflight, readJson, withUser } from '@/lib/mobile/http'
import { handleWritingRequest, type WritingBody } from '@/lib/writing-request'

export const OPTIONS = preflight

/**
 * POST { tool, inputs, opportunityId?, draftId?, action?: 'generate'|'fix', draft? }
 * Same run as the website: credit charge, refund on failure, saved draft.
 * Success: { text, checks, draftId, credits }. Out of credits: 402 { error, code: 'NO_CREDITS', credits }.
 */
export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req)
    if (!body) return json({ error: 'Invalid request.' }, 400)
    const result = await handleWritingRequest({ id: user.id, email: user.email, role: user.role }, body as WritingBody)
    return json(result.body, result.status)
  })
}
