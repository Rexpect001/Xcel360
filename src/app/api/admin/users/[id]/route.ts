export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(body.role !== undefined && { role: body.role }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Prevent deleting yourself
  if (params.id === session.user.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
