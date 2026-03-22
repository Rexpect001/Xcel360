export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { ids, action } = body as { ids: string[]; action: 'publish' | 'unpublish' | 'delete' }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 })
    }
    if (!['publish', 'unpublish', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'publish') {
      await db.resource.updateMany({ where: { id: { in: ids } }, data: { published: true } })
      return NextResponse.json({ success: true, count: ids.length })
    }

    if (action === 'unpublish') {
      await db.resource.updateMany({ where: { id: { in: ids } }, data: { published: false } })
      return NextResponse.json({ success: true, count: ids.length })
    }

    if (action === 'delete') {
      await db.resource.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ success: true, count: ids.length })
    }

    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
