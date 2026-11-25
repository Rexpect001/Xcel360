export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { fail, ok, preflight, readJson, withUser } from '@/lib/mobile/http'
import { getOwnDraft, trashDraft } from '@/lib/writing-drafts'

export const OPTIONS = preflight

/** PATCH { output } saves edits; { restorePrevious: true } swaps back to the previous version. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withUser(req, async (user) => {
    const draft = await getOwnDraft(user.id, params.id)
    if (!draft) return fail('Draft not found.', 404)
    const body = await readJson(req)
    if (body?.restorePrevious === true) {
      if (!draft.previousOutput) return fail('There is no previous version.')
      const updated = await prisma.writingDraft.update({
        where: { id: draft.id },
        data: { output: draft.previousOutput, previousOutput: draft.output },
        select: { output: true },
      })
      return ok({ output: updated.output, hasPrevious: true })
    }
    if (typeof body?.output !== 'string') return fail('Nothing to save.')
    await prisma.writingDraft.update({ where: { id: draft.id }, data: { output: body.output.slice(0, 20000) } })
    return ok({ saved: true })
  })
}

/** DELETE moves the draft to Trash (restorable on the website for 30 days). */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return withUser(req, async (user) => {
    const draft = await getOwnDraft(user.id, params.id)
    if (!draft) return fail('Draft not found.', 404)
    await trashDraft(draft.id)
    return ok({ trashed: true })
  })
}
