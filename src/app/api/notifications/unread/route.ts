export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Unread count plus the newest unread items, for the sidebar badge, the mobile
 * bell and the "new notice" toast. Kept small: it is polled while the dashboard is open.
 */
export async function GET() {
  const session = await getAuth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const where = { userId: session.user.id, read: false }
  const [count, latest] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, message: true, link: true, type: true, createdAt: true },
    }),
  ])
  return NextResponse.json({ count, latest }, { headers: { 'Cache-Control': 'private, no-store' } })
}
