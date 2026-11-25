export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { fail, ok, preflight, readJson, withUser } from '@/lib/mobile/http'
import { listingSelect, toCard } from '@/lib/mobile/listings'

export const OPTIONS = preflight

const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]{10,40}$/i.test(v)

/** GET the student's saved list (same list as the website), soonest deadline first. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const rows = await prisma.savedOpportunity.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: 'desc' },
      select: { savedAt: true, opportunity: { select: { ...listingSelect, status: true } } },
    })
    const items = rows
      .map((r) => ({ ...toCard(r.opportunity), savedAt: r.savedAt.toISOString(), closed: r.opportunity.status !== 'OPEN' || (r.opportunity.deadline !== null && r.opportunity.deadline.getTime() < new Date().setHours(0, 0, 0, 0)) }))
      .sort((a, b) => Number(a.closed) - Number(b.closed) || (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))
    return ok(items)
  })
}

/** POST { opportunityId } -> saves it. Saving twice is fine. */
export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req)
    if (!validId(body?.opportunityId)) return fail('Choose an opportunity to save.')
    const exists = await prisma.opportunity.findUnique({ where: { id: body.opportunityId }, select: { id: true } })
    if (!exists) return fail('This opportunity is no longer listed.', 404)
    await prisma.savedOpportunity.upsert({
      where: { userId_opportunityId: { userId: user.id, opportunityId: body.opportunityId } },
      update: {},
      create: { userId: user.id, opportunityId: body.opportunityId },
    })
    return ok({ saved: true })
  })
}

/** DELETE ?opportunityId= -> removes it from the saved list. */
export async function DELETE(req: Request) {
  return withUser(req, async (user) => {
    const id = new URL(req.url).searchParams.get('opportunityId')
    if (!validId(id)) return fail('Choose an opportunity to remove.')
    await prisma.savedOpportunity.deleteMany({ where: { userId: user.id, opportunityId: id } })
    return ok({ saved: false })
  })
}
