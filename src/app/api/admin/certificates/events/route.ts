export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// List events with registration + issued-certificate counts (for "Select Event").
export async function GET() {
  try {
    await requireAdmin()
    const events = await db.event.findMany({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        title: true,
        date: true,
        type: true,
        published: true,
        _count: { select: { registrations: true, certificates: true } },
      },
    })

    const result = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      type: e.type,
      published: e.published,
      registrationCount: e._count.registrations,
      certificateCount: e._count.certificates,
    }))

    return NextResponse.json({ events: result })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
