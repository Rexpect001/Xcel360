import prisma from '@/lib/prisma'

const HOURLY_LIMIT = 15
const DAILY_LIMIT = 40

/** A database transaction serializes reservations for the same user across functions. */
export async function reserveAiRun(userId: string, feature: string): Promise<string | null> {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))::text AS locked`
    const [hourly, daily] = await Promise.all([
      tx.activityLog.count({
        where: { userId, resource: 'ai', action: { in: ['AI_RESERVED', 'AI_COMPLETED'] }, createdAt: { gte: hourAgo } },
      }),
      tx.activityLog.count({
        where: { userId, resource: 'ai', action: { in: ['AI_RESERVED', 'AI_COMPLETED'] }, createdAt: { gte: dayAgo } },
      }),
    ])
    if (hourly >= HOURLY_LIMIT || daily >= DAILY_LIMIT) return null
    const run = await tx.activityLog.create({
      data: { userId, action: 'AI_RESERVED', resource: 'ai', resourceName: feature },
      select: { id: true },
    })
    return run.id
  })
}

export async function finishAiRun(id: string, details: Record<string, string | number>, succeeded: boolean) {
  await prisma.activityLog.update({
    where: { id },
    data: {
      action: succeeded ? 'AI_COMPLETED' : 'AI_FAILED',
      details: JSON.stringify(details),
    },
  })
}
