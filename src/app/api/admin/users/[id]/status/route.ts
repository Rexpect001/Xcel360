export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const VALID = ['ACTIVE', 'SUSPENDED', 'DISABLED']

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const { status } = await req.json()

    if (!VALID.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: { status },
      select: { id: true, name: true, email: true, status: true, role: true },
    })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
