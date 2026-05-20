export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const mentors = await prisma.mentorshipOffering.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(mentors)
}

export async function POST(req: Request) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const mentor = await prisma.mentorshipOffering.create({
    data: {
      mentor: body.mentor,
      title: body.title,
      description: body.description ?? null,
      expertise: body.expertise ?? [],
      available: body.available ?? true,
      link: body.link ?? null,
      linkedIn: body.linkedIn ?? null,
    },
  })
  return NextResponse.json(mentor, { status: 201 })
}
