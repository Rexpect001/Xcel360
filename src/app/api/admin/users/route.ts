export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const db = prisma as any

export async function GET(req: NextRequest) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const showAll = searchParams.get('all') === '1'
  const limit = Math.min(200, parseInt(searchParams.get('limit') ?? '100'))

  // Return empty array unless a query or explicit show-all is requested
  if (!q && !showAll) return NextResponse.json([])

  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
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
