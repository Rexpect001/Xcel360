export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()
    const beneficiaries = await (prisma as any).beneficiary.findMany({
      orderBy: { createdAt: 'desc' },
      include: { program: { select: { title: true, cohortNumber: true } } },
    })
    return NextResponse.json(beneficiaries)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const beneficiary = await (prisma as any).beneficiary.create({
      data: {
        firstName: body.firstName,
        department: body.department || null,
        school: body.school || null,
        programId: body.programId || null,
      },
    })
    return NextResponse.json(beneficiary, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create beneficiary' }, { status: 500 })
  }
}
