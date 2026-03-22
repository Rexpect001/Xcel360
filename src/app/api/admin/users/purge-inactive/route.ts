export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function POST() {
  try {
    await requireAdmin()

    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 2)

    // Delete users who have NEVER logged in AND joined more than 2 years ago,
    // OR whose last login was more than 2 years ago
    const result = await db.user.deleteMany({
      where: {
        role: 'USER', // never delete admins/editors/etc
        OR: [
          // Never logged in and joined 2+ years ago
          { lastLoginAt: null, createdAt: { lt: cutoff } },
          // Last login 2+ years ago
          { lastLoginAt: { lt: cutoff } },
        ],
      },
    })

    return NextResponse.json({ deleted: result.count })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// GET — preview how many would be deleted (dry run)
export async function GET() {
  try {
    await requireAdmin()

    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 2)

    const count = await db.user.count({
      where: {
        role: 'USER',
        OR: [
          { lastLoginAt: null, createdAt: { lt: cutoff } },
          { lastLoginAt: { lt: cutoff } },
        ],
      },
    })

    return NextResponse.json({ count, cutoff })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
