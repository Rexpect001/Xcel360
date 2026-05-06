export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSecureResponse } from '@/lib/security/headers'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return createSecureResponse({ error: 'Forbidden' }, 403, req)
  }

  const db = prisma as any

  const [activity, totals] = await Promise.all([
    db.toolPostActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.toolPostActivity.groupBy({
      by: ['poster'],
      _count: { _all: true },
      orderBy: { _count: { poster: 'desc' } },
    }),
  ])

  return createSecureResponse({ activity, totals }, 200, req)
}
