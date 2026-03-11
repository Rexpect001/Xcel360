export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()
    const programs = await (prisma as any).program.findMany({
      orderBy: { cohortNumber: 'asc' },
      include: { _count: { select: { beneficiaries: true } }, beneficiaries: { select: { id: true, firstName: true, department: true, school: true } } },
    })
    return NextResponse.json(programs)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const program = await (prisma as any).program.create({
      data: {
        title: body.title,
        cohortNumber: body.cohortNumber ? Number(body.cohortNumber) : null,
        description: body.description,
        focus: body.focus,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        participants: body.participants ? Number(body.participants) : 0,
        published: body.published ?? true,
      },
    })
    return NextResponse.json(program, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}
