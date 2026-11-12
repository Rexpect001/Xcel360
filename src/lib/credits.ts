import prisma from '@/lib/prisma'
import { FREE_CREDITS } from '@/lib/billing'

/** Staff accounts use the tools without spending credits (testing, demos). */
const UNLIMITED_ROLES = ['ADMIN', 'MANAGER']

export function hasUnlimitedCredits(role?: string | null) {
  return !!role && UNLIMITED_ROLES.includes(role)
}

/** Give every account its free credits once. Safe to call repeatedly. */
async function ensureFreeGrant(userId: string) {
  await prisma.creditEntry.upsert({
    where: { reference: `free:${userId}` },
    create: { userId, delta: FREE_CREDITS, reason: 'FREE_GRANT', reference: `free:${userId}`, note: 'Welcome credits' },
    update: {},
  })
}

export async function getBalance(userId: string): Promise<number> {
  await ensureFreeGrant(userId)
  const agg = await prisma.creditEntry.aggregate({ where: { userId }, _sum: { delta: true } })
  return agg._sum.delta ?? 0
}

/**
 * Take one credit for a run. Uses a per-user lock so two tabs cannot both spend
 * the last credit. Returns false when the balance is empty.
 */
export async function spendCredit(userId: string, runId: string, note: string): Promise<boolean> {
  await ensureFreeGrant(userId)
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'credits:' + userId}, 0))::text AS locked`
    const agg = await tx.creditEntry.aggregate({ where: { userId }, _sum: { delta: true } })
    if ((agg._sum.delta ?? 0) < 1) return false
    await tx.creditEntry.create({ data: { userId, delta: -1, reason: 'DRAFT', reference: `run:${runId}`, note } })
    return true
  })
}

/** Give the credit back when a run fails. Only once per run, and only if it was spent. */
export async function refundCredit(userId: string, runId: string) {
  const spent = await prisma.creditEntry.findUnique({ where: { reference: `run:${runId}` } })
  if (!spent) return
  await prisma.creditEntry.upsert({
    where: { reference: `refund:${runId}` },
    create: { userId, delta: 1, reason: 'REFUND', reference: `refund:${runId}`, note: 'Draft failed' },
    update: {},
  })
}

export async function creditHistory(userId: string, take = 30) {
  return prisma.creditEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, delta: true, reason: true, note: true, createdAt: true },
  })
}
