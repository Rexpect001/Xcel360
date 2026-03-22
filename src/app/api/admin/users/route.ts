export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET() {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      image: true,
      _count: { select: { savedOpps: true, applications: true } },
    },
  })
  return NextResponse.json(users)
}
