export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/admin/mentorship/bulk
// body: { action: 'available' | 'unavailable' | 'delete', ids: string[] }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { action, ids } = await req.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    switch (action) {
      case 'available':
        await prisma.mentorshipOffering.updateMany({
          where: { id: { in: ids } },
          data: { available: true },
        })
        return NextResponse.json({ ok: true, affected: ids.length })

      case 'unavailable':
        await prisma.mentorshipOffering.updateMany({
          where: { id: { in: ids } },
          data: { available: false },
        })
        return NextResponse.json({ ok: true, affected: ids.length })

      case 'delete':
        await prisma.mentorshipOffering.deleteMany({ where: { id: { in: ids } } })
        return NextResponse.json({ ok: true, affected: ids.length })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('[mentorship/bulk]', err)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
