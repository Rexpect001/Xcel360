export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseDeadline } from '@/lib/utils'
import { revalidateOpportunityPages } from '@/lib/revalidate-opportunities'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    const db = prisma as any

    // Sanitize: strip read-only/auto fields, coerce types
    const { id: _id, createdAt: _c, updatedAt: _u, views: _v, savedBy: _s, applications: _a, _count: _cnt, ...fields } = body

    // Convert deadline string to Date if present
    if (fields.deadline) {
      fields.deadline = parseDeadline(fields.deadline)
    }

    const opp = await db.opportunity.update({ where: { id: params.id }, data: fields })
    revalidateOpportunityPages()
    return NextResponse.json(opp)
  } catch (e: any) {
    console.error('[OPPORTUNITY PATCH ERROR]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Failed to update' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await prisma.opportunity.delete({ where: { id: params.id } })
    revalidateOpportunityPages()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
