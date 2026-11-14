import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { CREDITS_PER_USE, FREE_CREDITS, legacyConversionDelta } from '@/lib/billing'

/** Staff accounts use the tools without spending credits (testing, demos). */
const UNLIMITED_ROLES = ['ADMIN', 'MANAGER']

/** Free grant size before Nov 2026, when 1 credit paid for 1 draft. */
const LEGACY_FREE_CREDITS = 3

export function hasUnlimitedCredits(role?: string | null) {
  return !!role && UNLIMITED_ROLES.includes(role)
}

function isUniqueClash(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

/**
 * Give every account its welcome credits once, and move accounts from the old
 * units (1 credit = 1 draft) to the new ones (CREDITS_PER_USE credits = 1 draft)
 * without losing value. Safe to call repeatedly and concurrently: every write
 * uses a unique reference, so a second caller hits a clash and stops.
 */
export async function ensureWallet(userId: string) {
  try {
    const free = await prisma.creditEntry.findUnique({ where: { reference: `free:${userId}` }, select: { delta: true } })
    if (!free) {
      await prisma.creditEntry.create({
        data: { userId, delta: FREE_CREDITS, reason: 'FREE_GRANT', reference: `free:${userId}`, note: 'Welcome credits' },
      })
      return
    }
    if (free.delta > LEGACY_FREE_CREDITS) return // already on the new units

    const marker = `units-v2:${userId}`
    if (await prisma.creditEntry.findUnique({ where: { reference: marker }, select: { id: true } })) return
    const agg = await prisma.creditEntry.aggregate({ where: { userId }, _sum: { delta: true } })
    const delta = legacyConversionDelta(agg._sum.delta ?? 0, free.delta)
    await prisma.creditEntry.create({
      data: { userId, delta, reason: 'ADMIN', reference: marker, note: 'Credits converted to the new pricing (20 credits per draft)' },
    })
  } catch (error) {
    if (!isUniqueClash(error)) throw error
  }
}

export async function getBalance(userId: string): Promise<number> {
  // Fast path (one round trip): read the wallet markers and the sum together. Only an
  // account that still needs its welcome grant or unit conversion pays for more queries.
  const [markers, agg] = await Promise.all([
    prisma.creditEntry.findMany({
      where: { reference: { in: [`free:${userId}`, `units-v2:${userId}`] } },
      select: { reference: true, delta: true },
    }),
    prisma.creditEntry.aggregate({ where: { userId }, _sum: { delta: true } }),
  ])
  const free = markers.find((m) => m.reference === `free:${userId}`)
  const settled = !!free && (free.delta > LEGACY_FREE_CREDITS || markers.some((m) => m.reference === `units-v2:${userId}`))
  if (settled) return agg._sum.delta ?? 0

  await ensureWallet(userId)
  const fresh = await prisma.creditEntry.aggregate({ where: { userId }, _sum: { delta: true } })
  return fresh._sum.delta ?? 0
}

/**
 * Take the cost of one run. Uses a per-user lock so two tabs cannot both spend
 * the last credits. Returns false when the balance is too low.
 */
export async function spendCredit(userId: string, runId: string, note: string, cost = CREDITS_PER_USE): Promise<boolean> {
  await ensureWallet(userId)
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${'credits:' + userId}, 0))::text AS locked`
    const agg = await tx.creditEntry.aggregate({ where: { userId }, _sum: { delta: true } })
    if ((agg._sum.delta ?? 0) < cost) return false
    await tx.creditEntry.create({ data: { userId, delta: -cost, reason: 'DRAFT', reference: `run:${runId}`, note } })
    return true
  })
}

/** Give back exactly what a failed run took. Only once per run, and only if it was spent. */
export async function refundCredit(userId: string, runId: string) {
  const spent = await prisma.creditEntry.findUnique({ where: { reference: `run:${runId}` }, select: { delta: true } })
  if (!spent || spent.delta >= 0) return
  await prisma.creditEntry.upsert({
    where: { reference: `refund:${runId}` },
    create: { userId, delta: -spent.delta, reason: 'REFUND', reference: `refund:${runId}`, note: 'Draft failed' },
    update: {},
  })
}

export async function creditHistory(userId: string, take = 30) {
  return prisma.creditEntry.findMany({
    where: { userId, delta: { not: 0 } },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, delta: true, reason: true, note: true, createdAt: true },
  })
}

/**
 * Add credits outside a purchase (admin gift, referral reward) and tell the user
 * in-app and by email. `reference` makes the grant happen at most once.
 * Returns false if this reference was already granted.
 */
export async function grantCredits({
  userId,
  amount,
  reference,
  reason,
  note,
  message,
}: {
  userId: string
  amount: number
  reference: string
  reason: 'ADMIN' | 'REFERRAL'
  note: string
  /** One sentence explaining why, shown in the notification and email. */
  message: string
}): Promise<boolean> {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('Credit amount must be a positive whole number')
  await ensureWallet(userId)
  try {
    await prisma.creditEntry.create({ data: { userId, delta: amount, reason, reference, note: note.slice(0, 200) } })
  } catch (error) {
    if (isUniqueClash(error)) return false
    throw error
  }
  await notifyCreditsReceived(userId, amount, message).catch((e) => console.error('[credits] notify failed', e))
  return true
}

async function notifyCreditsReceived(userId: string, amount: number, message: string) {
  const [user, balance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, profile: { select: { notifyEmail: true, notifyInApp: true } } },
    }),
    getBalance(userId),
  ])
  if (!user) return
  if (user.profile?.notifyInApp !== false) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'GENERAL',
        title: `You received ${amount} credits`,
        message: `${message} Your balance is now ${balance} credits.`,
        link: '/dashboard/billing',
      },
    })
  }
  if (user.email && user.profile?.notifyEmail !== false) {
    const { sendCreditsReceivedEmail } = await import('@/lib/email')
    await sendCreditsReceivedEmail({ to: user.email, name: user.name?.split(' ')[0] || 'there', amount, reason: message, balance })
  }
}
