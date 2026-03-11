import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await requireAuth()
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(notifications)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { id, readAll } = await req.json()

    if (readAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id },
        data: { read: true },
      })
    } else if (id) {
      await prisma.notification.update({
        where: { id, userId: session.user.id },
        data: { read: true },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
