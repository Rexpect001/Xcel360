export const dynamic = 'force-dynamic'
import { ok, preflight, withUser } from '@/lib/mobile/http'
import { listOwnDrafts } from '@/lib/writing-drafts'
import { WRITING_TOOLS, isToolId } from '@/lib/writing-tools'

export const OPTIONS = preflight

/** GET the student's saved drafts (same list as My drafts on the website), newest first. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const drafts = await listOwnDrafts(user.id)
    return ok(drafts.map((d) => ({
      id: d.id,
      tool: d.tool,
      toolName: isToolId(d.tool) ? WRITING_TOOLS[d.tool].name : d.tool,
      title: d.title,
      updatedAt: d.updatedAt.toISOString(),
    })))
  })
}
