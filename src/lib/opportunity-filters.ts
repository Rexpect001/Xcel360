import type { Prisma } from '@prisma/client'

/** Midnight today (server time) - an opportunity closing today is still live. */
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Public listings only show opportunities that can still be applied for:
 * OPEN and either rolling (no deadline) or closing today or later. This also
 * keeps mis-parsed historic dates (e.g. 2001) off every public page.
 */
export function liveOpportunityWhere(extra: Prisma.OpportunityWhereInput = {}): Prisma.OpportunityWhereInput {
  return {
    status: 'OPEN',
    AND: [{ OR: [{ deadline: null }, { deadline: { gte: startOfToday() } }] }, extra],
  }
}
