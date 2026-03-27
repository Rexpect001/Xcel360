export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    await requireRole("ADMIN")

    const [
      totalUsers,
      totalOpportunities,
      totalSaved,
      totalApplications,
      openOpportunities,
      recentUsers,
      popularOpportunities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.opportunity.count(),
      prisma.savedOpportunity.count(),
      prisma.application.count(),
      prisma.opportunity.count({ where: { status: 'OPEN' } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
      prisma.opportunity.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        include: { _count: { select: { savedBy: true, applications: true } } },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalOpportunities,
      totalSaved,
      totalApplications,
      openOpportunities,
      recentUsers,
      popularOpportunities,
    })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
