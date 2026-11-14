import prisma from '@/lib/prisma'
import type { OpportunityContext } from '@/lib/writing-engine'
import type { OpportunitySummary } from '@/lib/writing-tools'

/** Oldest active drafts beyond this are moved to Trash when a new one is saved. */
export const MAX_DRAFTS_PER_USER = 100

/**
 * Draft lifecycle:
 *   days 1-30   active in My drafts
 *   day 30      moved to Trash (also where a user's "Delete" sends it)
 *   day 60      deleted for good (30 days after it reached Trash)
 * Restoring from Trash starts a fresh 30-day active window.
 */
export const DRAFT_ACTIVE_DAYS = 30
export const DRAFT_TRASH_DAYS = 30
const DAY = 864e5

export function trashDueAt(activeSince: Date): Date {
  return new Date(activeSince.getTime() + DRAFT_ACTIVE_DAYS * DAY)
}

export function purgeDueAt(trashedAt: Date): Date {
  return new Date(trashedAt.getTime() + DRAFT_TRASH_DAYS * DAY)
}

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

/** An active (not trashed) draft owned by this user. */
export async function getOwnDraft(userId: string, id: unknown) {
  if (typeof id !== 'string' || id.length > 40) return null
  return prisma.writingDraft.findFirst({ where: { id, userId, trashedAt: null } })
}

/** Any draft owned by this user, including trashed ones (for restore / delete forever). */
export async function getOwnDraftAnyState(userId: string, id: unknown) {
  if (typeof id !== 'string' || id.length > 40) return null
  return prisma.writingDraft.findFirst({ where: { id, userId } })
}

const LIST_SELECT = {
  id: true, tool: true, title: true, opportunityId: true, updatedAt: true, createdAt: true, activeSince: true, trashedAt: true,
} as const

export async function listOwnDrafts(userId: string, take = 50) {
  await runDraftLifecycle(userId).catch(console.error)
  return prisma.writingDraft.findMany({
    where: { userId, trashedAt: null },
    orderBy: { updatedAt: 'desc' },
    take,
    select: LIST_SELECT,
  })
}

export async function listTrashedDrafts(userId: string, take = 100) {
  return prisma.writingDraft.findMany({
    where: { userId, trashedAt: { not: null } },
    orderBy: { trashedAt: 'desc' },
    take,
    select: LIST_SELECT,
  })
}

export async function trashDraft(id: string) {
  await prisma.writingDraft.update({ where: { id }, data: { trashedAt: new Date() } })
}

export async function restoreDraft(id: string) {
  await prisma.writingDraft.update({ where: { id }, data: { trashedAt: null, activeSince: new Date() } })
}

/**
 * Move expired drafts to Trash and delete ones that have been in Trash too long.
 * Pass a userId to run it for one user (done lazily when they open their drafts);
 * the daily cron runs it for everyone.
 */
export async function runDraftLifecycle(userId?: string) {
  const now = Date.now()
  const scope = userId ? { userId } : {}
  const trashed = await prisma.writingDraft.updateMany({
    where: { ...scope, trashedAt: null, activeSince: { lt: new Date(now - DRAFT_ACTIVE_DAYS * DAY) } },
    data: { trashedAt: new Date(now) },
  })
  const purged = await prisma.writingDraft.deleteMany({
    where: { ...scope, trashedAt: { lt: new Date(now - DRAFT_TRASH_DAYS * DAY) } },
  })
  return { trashed: trashed.count, purged: purged.count }
}

/** Keep at most MAX_DRAFTS_PER_USER active drafts; the oldest go to Trash, not straight to deletion. */
export async function pruneDrafts(userId: string) {
  const extra = await prisma.writingDraft.findMany({
    where: { userId, trashedAt: null },
    orderBy: { updatedAt: 'desc' },
    skip: MAX_DRAFTS_PER_USER,
    select: { id: true },
  })
  if (extra.length) {
    await prisma.writingDraft.updateMany({ where: { id: { in: extra.map((d) => d.id) } }, data: { trashedAt: new Date() } })
  }
}
