export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const APP_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'
  const db = prisma as any

  const opps = await db.opportunity.findMany({
    where: { imageUrl: null },
    select: { id: true, category: true },
  })

  if (opps.length === 0) {
    return NextResponse.json({ updated: 0, message: 'All opportunities already have images.' })
  }

  const updates = opps.map((opp: { id: string; category: string }) => {
    const typeParam = opp.category === 'JOB' ? 'job' : opp.category === 'INTERNSHIP' ? 'internship' : 'scholarship'
    return db.opportunity.update({
      where: { id: opp.id },
      data: { imageUrl: `${APP_URL}/api/og?id=${opp.id}&type=${typeParam}&simple=true` },
    })
  })

  await Promise.all(updates)

  return NextResponse.json({ updated: opps.length, message: `Backfilled ${opps.length} opportunities.` })
}
