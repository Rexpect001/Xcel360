export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  const db = prisma as any
  const templates = await db.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  const { name, subject, htmlBody } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!htmlBody?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })
  const db = prisma as any
  const t = await db.emailTemplate.create({ data: { name: name.trim(), subject: subject ?? '', htmlBody } })
  return NextResponse.json(t)
}

export async function PATCH(req: NextRequest) {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  const { id, name, subject, htmlBody } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!htmlBody?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })
  const db = prisma as any
  const t = await db.emailTemplate.update({
    where: { id },
    data: { name: name.trim(), subject: subject ?? '', htmlBody },
  })
  return NextResponse.json(t)
}

export async function DELETE(req: NextRequest) {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  const { id } = await req.json()
  const db = prisma as any
  await db.emailTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
