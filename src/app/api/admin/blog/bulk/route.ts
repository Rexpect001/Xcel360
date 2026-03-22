export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { ids, action } = body as { ids: string[]; action: 'publish' | 'unpublish' | 'delete' }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No ids provided' }, { status: 400 })
  }

  if (!['publish', 'unpublish', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (action === 'publish') {
    await prisma.blogPost.updateMany({
      where: { id: { in: ids } },
      data: { published: true },
    })
    return NextResponse.json({ success: true, affected: ids.length })
  }

  if (action === 'unpublish') {
    await prisma.blogPost.updateMany({
      where: { id: { in: ids } },
      data: { published: false },
    })
    return NextResponse.json({ success: true, affected: ids.length })
  }

  if (action === 'delete') {
    await prisma.blogPost.deleteMany({
      where: { id: { in: ids } },
    })
    return NextResponse.json({ success: true, affected: ids.length })
  }
}
