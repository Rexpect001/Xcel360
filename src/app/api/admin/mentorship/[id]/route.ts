import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const mentor = await prisma.mentorshipOffering.update({
    where: { id: params.id },
    data: {
      ...(body.mentor !== undefined && { mentor: body.mentor }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.expertise !== undefined && { expertise: body.expertise }),
      ...(body.available !== undefined && { available: body.available }),
      ...(body.link !== undefined && { link: body.link }),
    },
  })
  return NextResponse.json(mentor)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.mentorshipOffering.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
