export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/admin/opportunities/bulk
// body: { action: 'delete' | 'feature' | 'unfeature' | 'open' | 'close', ids: string[] }
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { action, ids } = await req.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    switch (action) {
      case 'delete':
        await prisma.opportunity.deleteMany({ where: { id: { in: ids } } })
        return NextResponse.json({ ok: true, affected: ids.length })

      case 'feature':
        await prisma.opportunity.updateMany({ where: { id: { in: ids } }, data: { featured: true } })
        return NextResponse.json({ ok: true, affected: ids.length })

      case 'unfeature':
        await prisma.opportunity.updateMany({ where: { id: { in: ids } }, data: { featured: false } })
        return NextResponse.json({ ok: true, affected: ids.length })

      case 'open':
        await prisma.opportunity.updateMany({ where: { id: { in: ids } }, data: { status: 'OPEN' } })
        return NextResponse.json({ ok: true, affected: ids.length })

      case 'close':
        await prisma.opportunity.updateMany({ where: { id: { in: ids } }, data: { status: 'CLOSED' } })
        return NextResponse.json({ ok: true, affected: ids.length })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('[bulk]', err)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
