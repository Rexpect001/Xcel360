export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/

// GET — preview how many would be removed
export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const all = await db.opportunity.findMany({
    where: { OR: [{ applicationLink: null }, { applicationLink: '' }] },
    select: { id: true, title: true, description: true },
  })

  const toRemove = all.filter((o: any) => !EMAIL_RE.test(o.description ?? ''))
  return NextResponse.json({
    preview: toRemove.length,
    titles: toRemove.slice(0, 10).map((o: any) => o.title),
    message: `${toRemove.length} opportunities have no application link or email and will be deleted.`,
  })
}

// POST — actually delete them
export async function POST() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const all = await db.opportunity.findMany({
    where: { OR: [{ applicationLink: null }, { applicationLink: '' }] },
    select: { id: true, description: true },
  })

  const ids = all
    .filter((o: any) => !EMAIL_RE.test(o.description ?? ''))
    .map((o: any) => o.id)

  if (ids.length === 0) return NextResponse.json({ deleted: 0, message: 'Nothing to clean up.' })

  await db.opportunity.deleteMany({ where: { id: { in: ids } } })
  return NextResponse.json({ deleted: ids.length, message: `Removed ${ids.length} opportunities with no way to apply.` })
}
