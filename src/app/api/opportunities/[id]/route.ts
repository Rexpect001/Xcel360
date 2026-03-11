export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { savedBy: true, applications: true } },
    },
  })

  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment view count
  await prisma.opportunity.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  }).catch(() => {})

  return NextResponse.json(opp)
}
