import prisma from '@/lib/prisma'
import type { OpportunityContext } from '@/lib/writing-engine'
import type { OpportunitySummary } from '@/lib/writing-tools'

/** Oldest drafts beyond this are removed when a new one is saved. */
export const MAX_DRAFTS_PER_USER = 100

export async function getOpportunityContext(id: unknown): Promise<OpportunityContext | null> {
  if (typeof id !== 'string' || !/^[a-z0-9]{10,40}$/i.test(id)) return null
  return prisma.opportunity.findUnique({
    where: { id },
    select: {
      id: true, title: true, hostOrg: true, company: true, category: true, country: true,
      programLevel: true, fundingType: true, deadline: true, eligibility: true,
      requiredDocs: true, description: true, skills: true,
    },
  }).catch(() => null)
}

export function toSummary(o: OpportunityContext): OpportunitySummary {
  return { id: o.id, title: o.title, org: o.company || o.hostOrg, category: o.category, eligibility: o.eligibility, skills: o.skills ?? [] }
}

export async function getOwnDraft(userId: string, id: unknown) {
  if (typeof id !== 'string' || id.length > 40) return null
  return prisma.writingDraft.findFirst({ where: { id, userId } })
}

export async function listOwnDrafts(userId: string, take = 50) {
  return prisma.writingDraft.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take,
    select: { id: true, tool: true, title: true, opportunityId: true, updatedAt: true, createdAt: true },
  })
}

export async function pruneDrafts(userId: string) {
  const extra = await prisma.writingDraft.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    skip: MAX_DRAFTS_PER_USER,
    select: { id: true },
  })
  if (extra.length) await prisma.writingDraft.deleteMany({ where: { id: { in: extra.map((d) => d.id) } } })
}
