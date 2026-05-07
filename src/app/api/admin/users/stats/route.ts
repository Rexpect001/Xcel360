export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

  const [total, active, suspended, disabled, newToday, newThisWeek, newThisMonth, daily, monthly] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { status: 'DISABLED' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
               COUNT(*)::integer AS count
        FROM "User"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        ORDER BY date ASC
      `,
      prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM') AS month,
               COUNT(*)::integer AS count
        FROM "User"
        WHERE "createdAt" >= ${twelveMonthsAgo}
        GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM')
        ORDER BY month ASC
      `,
    ])

  // Fill zeros for all 30 days
  const dailyFilled: { date: string; users: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const found = (daily as any[]).find((r: any) => r.date === key)
    dailyFilled.push({ date: key, users: found ? Number(found.count) : 0 })
  }

  // Fill zeros for all 12 months
  const monthlyFilled: { month: string; users: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const found = (monthly as any[]).find((r: any) => r.month === key)
    monthlyFilled.push({ month: key, users: found ? Number(found.count) : 0 })
  }

  return NextResponse.json({
    total, active, suspended, disabled,
    newToday, newThisWeek, newThisMonth,
    daily: dailyFilled,
    monthly: monthlyFilled,
  })
}
