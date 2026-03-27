export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const VALID_ACTIONS = ['delete', 'suspend', 'disable', 'activate']

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("ADMIN")
    const { ids, action } = await req.json()

    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'No users selected' }, { status: 400 })
    if (!VALID_ACTIONS.includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    // Never allow acting on yourself
    const safeIds = ids.filter((id: string) => id !== session.user.id)
    if (safeIds.length === 0) return NextResponse.json({ error: 'Cannot perform this action on your own account' }, { status: 400 })

    if (action === 'delete') {
      await prisma.user.deleteMany({ where: { id: { in: safeIds } } })
    } else {
      const status = action === 'suspend' ? 'SUSPENDED' : action === 'disable' ? 'DISABLED' : 'ACTIVE'
      await db.user.updateMany({ where: { id: { in: safeIds } }, data: { status } })
    }

    return NextResponse.json({ ok: true, count: safeIds.length })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
