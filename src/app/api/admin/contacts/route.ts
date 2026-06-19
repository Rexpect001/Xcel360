export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET — paginated contacts list with optional search & source filter
export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const search = searchParams.get('q')?.trim() ?? ''
  const source = searchParams.get('source') ?? ''
  const limit  = 100

  const where: any = {}
  if (search) where.OR = [
    { email: { contains: search, mode: 'insensitive' } },
    { name:  { contains: search, mode: 'insensitive' } },
  ]
  if (source) where.source = source

  const [contacts, total] = await Promise.all([
    db.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    db.contact.count({ where }),
  ])

  // source breakdown for stats
  const breakdown = await db.contact.groupBy({ by: ['source'], _count: { _all: true } })

  return NextResponse.json({ contacts, total, page, pages: Math.ceil(total / limit), breakdown })
}

// DELETE — remove one contact
export async function DELETE(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  const { id } = await req.json()
  const db = prisma as any
  await db.contact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
