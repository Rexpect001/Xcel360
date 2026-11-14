import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getBalance, grantCredits } from '@/lib/credits'
import { ADMIN_GRANT_MAX } from '@/lib/billing'

export const dynamic = 'force-dynamic'

/** Current balance, for the admin gift dialog. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const balance = await getBalance(params.id).catch(() => null)
  return NextResponse.json({ balance })
}

/**
 * Gift free credits to a user (support, friends and family, competitions).
 * The user is notified in-app and by email; the grant is logged.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const amount = Number(body.amount)
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 160) : ''
  if (!Number.isInteger(amount) || amount < 1 || amount > ADMIN_GRANT_MAX) {
    return NextResponse.json({ error: `Enter a whole number from 1 to ${ADMIN_GRANT_MAX}.` }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, email: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Client sends a one-off key so a double click cannot grant twice
  const key = typeof body.requestId === 'string' && /^[\w-]{8,64}$/.test(body.requestId) ? body.requestId : crypto.randomUUID()
  const granted = await grantCredits({
    userId: user.id,
    amount,
    reference: `admin:${key}`,
    reason: 'ADMIN',
    note: reason || 'Gift from the Xcel360 team',
    message: reason ? `A gift from the Xcel360 team: ${reason}.` : 'A gift from the Xcel360 team.',
  })

  if (granted) {
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email ?? undefined,
        action: 'UPDATE',
        resource: 'credits',
        resourceId: user.id,
        resourceName: user.email,
        details: `Granted ${amount} credits${reason ? `: ${reason}` : ''}`,
      },
    }).catch(() => {})
  }

  const balance = await getBalance(user.id)
  return NextResponse.json({ ok: true, duplicate: !granted, balance })
}
