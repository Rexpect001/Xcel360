export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { scheduleDeadlineReminders } from '@/lib/notifications'

export async function GET() {
  try {
    const session = await requireAuth()
    const saved = await prisma.savedOpportunity.findMany({
      where: { userId: session.user.id },
      include: { opportunity: true },
      orderBy: { savedAt: 'desc' },
    })
    return NextResponse.json(saved)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { opportunityId } = await req.json()

    if (!opportunityId) return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 })

    const saved = await prisma.savedOpportunity.create({
      data: { userId: session.user.id, opportunityId },
    })

    // Schedule deadline reminders (non-blocking)
    scheduleDeadlineReminders(session.user.id, opportunityId).catch(console.error)

    return NextResponse.json(saved, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Already saved' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { opportunityId } = await req.json()

    await prisma.savedOpportunity.delete({
      where: { userId_opportunityId: { userId: session.user.id, opportunityId } },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
