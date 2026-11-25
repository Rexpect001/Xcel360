import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BROADCAST_ACTION } from '@/lib/broadcast'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH = 1000

type Audience = 'all' | 'level' | 'test'

/** Who receives a broadcast. Users who switched off in-app notifications are always skipped. */
function recipientsWhere(audience: Audience, level: string, adminId: string): Prisma.UserWhereInput {
  if (audience === 'test') return { id: adminId }
  const base: Prisma.UserWhereInput = { status: 'ACTIVE', OR: [{ profile: null }, { profile: { notifyInApp: true } }] }
  if (audience === 'level') {
    return { status: 'ACTIVE', profile: { notifyInApp: true, level: { equals: level, mode: 'insensitive' } } }
  }
  return base
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'ADMIN' ? session : null
}

function parseAudience(raw: unknown, rawLevel: unknown): { audience: Audience; level: string } | { error: string } {
  const audience: Audience = raw === 'level' || raw === 'test' ? raw : 'all'
  const level = typeof rawLevel === 'string' ? rawLevel.trim().slice(0, 60) : ''
  if (audience === 'level' && !level) return { error: 'Choose a study level.' }
  return { audience, level }
}

/** GET ?audience=all|level&level=Masters -> how many people a send would reach. */
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const parsed = parseAudience(searchParams.get('audience'), searchParams.get('level'))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const recipients = await prisma.user.count({ where: recipientsWhere(parsed.audience, parsed.level, session.user.id) })
  return NextResponse.json({ recipients })
}

/**
 * Send one notice to users' in-app notifications. Used by Admin -> Notifications
 * and by the "notify everyone" option on the site announcement in Settings.
 * Real sends (not tests) are recorded in the Activity Log, which is also the
 * history shown on the Notifications admin page.
 */
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : ''
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 80) : 'Update from Xcel360'
  const rawLink = typeof body.link === 'string' ? body.link.trim() : ''
  // Only site-relative paths or https links
  const link = rawLink && (/^\/(?!\/)/.test(rawLink) || /^https:\/\//i.test(rawLink)) ? rawLink.slice(0, 500) : undefined
  if (!message) return NextResponse.json({ error: 'Add a message to send.' }, { status: 400 })
  if (rawLink && !link) return NextResponse.json({ error: 'Links must start with / (a page on Xcel360) or https://' }, { status: 400 })

  const parsed = parseAudience(body.audience, body.level)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { audience, level } = parsed

  const users = await prisma.user.findMany({ where: recipientsWhere(audience, level, session.user.id), select: { id: true } })

  let sent = 0
  for (let i = 0; i < users.length; i += BATCH) {
    const chunk = users.slice(i, i + BATCH)
    const res = await prisma.notification.createMany({
      data: chunk.map((u) => ({ userId: u.id, type: 'GENERAL' as const, title, message, link })),
    })
    sent += res.count
  }

  if (audience !== 'test') {
    await prisma.activityLog
      .create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email ?? null,
          userRole: session.user.role ?? null,
          action: BROADCAST_ACTION,
          resource: 'notification',
          resourceName: title.slice(0, 190),
          details: JSON.stringify({ title, message, link: link ?? null, audience, level: level || null, sent }),
        },
      })
      .catch((e) => console.error('[broadcast] could not record history', e))
  }

  return NextResponse.json({ sent })
}
