export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const events = await db.event.findMany({
      orderBy: { date: 'asc' },
      include: {
        _count: { select: { registrations: true, questions: true } },
      },
    })
    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const event = await db.event.create({ data: body })
    return NextResponse.json(event, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
