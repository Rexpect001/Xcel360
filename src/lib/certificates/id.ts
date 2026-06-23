import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const PREFIX = 'XCL360'

/**
 * Generate the next sequential, human-readable certificate ID, e.g.
 * XCL360-2026-000001. Uses a per-year counter row updated atomically so
 * concurrent generations never collide.
 */
export async function nextCertificateId(year = new Date().getFullYear()): Promise<string> {
  const yearStr = String(year)

  // Atomic increment: upsert + return the new seq inside a single statement.
  const row = await db.certificateSequence.upsert({
    where: { year: yearStr },
    create: { year: yearStr, seq: 1 },
    update: { seq: { increment: 1 } },
  })

  const seq = String(row.seq).padStart(6, '0')
  return `${PREFIX}-${yearStr}-${seq}`
}
