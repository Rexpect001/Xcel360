export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DEFAULT_CHECKLIST_ITEMS } from '@/types'
import { ApplicationStatus } from '@prisma/client'

export async function GET() {
  try {
    const session = await requireAuth()
    const apps = await prisma.application.findMany({
      where: { userId: session.user.id },
      include: {
        opportunity: true,
        checklist: true,
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(apps)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { opportunityId } = await req.json()
    if (typeof opportunityId !== 'string' || !opportunityId.trim() || opportunityId.length > 100) {
      return NextResponse.json({ error: 'Invalid opportunity' }, { status: 400 })
    }
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { requiredDocs: true },
    })
    if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    const requiredDocs = Array.from(new Set(opportunity.requiredDocs.map((item) => item.trim()).filter(Boolean))).slice(0, 20)

    const app = await prisma.application.create({
      data: {
        userId: session.user.id,
        opportunityId,
        status: ApplicationStatus.PREPARING,
        checklist: {
          create: (requiredDocs.length ? requiredDocs : DEFAULT_CHECKLIST_ITEMS).map((item) => ({ item })),
        },
      },
      include: { opportunity: true, checklist: true },
    })

    return NextResponse.json(app, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Already tracking' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
