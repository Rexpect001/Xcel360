import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH = 1000

/**
 * Send one update to every active user's in-app notifications, so an admin
 * announcement shows both in the site bar and under Notifications.
 * Users who switched off in-app notifications are skipped.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 300) : ''
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 80) : 'Update from Xcel360'
  const rawLink = typeof body.link === 'string' ? body.link.trim() : ''
  // Only site-relative paths or https links
  const link = rawLink && (/^\/(?!\/)/.test(rawLink) || /^https:\/\//i.test(rawLink)) ? rawLink.slice(0, 500) : undefined
  if (!message) return NextResponse.json({ error: 'Add a message to send.' }, { status: 400 })

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE', OR: [{ profile: null }, { profile: { notifyInApp: true } }] },
    select: { id: true },
  })

  let sent = 0
  for (let i = 0; i < users.length; i += BATCH) {
    const chunk = users.slice(i, i + BATCH)
    const res = await prisma.notification.createMany({
      data: chunk.map((u) => ({ userId: u.id, type: 'GENERAL' as const, title, message, link })),
    })
    sent += res.count
  }

  return NextResponse.json({ sent })
}
