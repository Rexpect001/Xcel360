export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.TOOLS_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const poster = new URL(req.url).searchParams.get('poster') ?? 'anonymous'
  const db = prisma as any

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [thisMonth, allTime] = await Promise.all([
    db.toolPostActivity.count({
      where: { poster, createdAt: { gte: monthStart } },
    }),
    db.toolPostActivity.count({ where: { poster } }),
  ])

  return NextResponse.json({ poster, thisMonth, allTime })
}
