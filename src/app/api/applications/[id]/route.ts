export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { status, notes } = await req.json()

    const app = await prisma.application.update({
      where: { id: params.id, userId: session.user.id },
      data: { ...(status && { status }), ...(notes !== undefined && { notes }) },
      include: { opportunity: true, checklist: true },
    })

    return NextResponse.json(app)
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    await prisma.application.delete({ where: { id: params.id, userId: session.user.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
