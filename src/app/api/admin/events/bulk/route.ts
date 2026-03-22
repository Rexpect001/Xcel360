export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { ids, action } = await req.json()

    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'No events selected' }, { status: 400 })

    if (action === 'delete') {
      await prisma.event.deleteMany({ where: { id: { in: ids } } })
    } else if (action === 'publish') {
      await prisma.event.updateMany({ where: { id: { in: ids } }, data: { published: true } })
    } else if (action === 'unpublish') {
      await prisma.event.updateMany({ where: { id: { in: ids } }, data: { published: false } })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, count: ids.length })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
