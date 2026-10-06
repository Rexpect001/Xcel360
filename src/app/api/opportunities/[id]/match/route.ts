import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuth } from '@/lib/auth'
import { scoreOpportunity } from '@/lib/matching'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [opportunity, profile] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id: params.id } }),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
  ])
  if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(
    { match: profile ? scoreOpportunity(opportunity, profile) : null },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
