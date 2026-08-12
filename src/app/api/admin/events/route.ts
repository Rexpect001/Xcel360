export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateAndStoreOpImage } from '@/lib/generateOpImage'

const APP_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

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

    // No cover image supplied — render once now and store a permanent Blob
    // URL, so social shares don't hit the dynamic /api/og renderer forever.
    if (!event.coverImage) {
      const staticUrl = await generateAndStoreOpImage(event.id, 'event', APP_URL)
      if (staticUrl) {
        await db.event.update({ where: { id: event.id }, data: { coverImage: staticUrl } })
        event.coverImage = staticUrl
      }
    }

    return NextResponse.json(event, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
