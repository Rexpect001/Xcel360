export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateAndStoreOpImage } from '@/lib/generateOpImage'

export async function POST() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const APP_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'
  const db = prisma as any

  // Pick up opportunities that either have no image OR still point to the
  // dynamic /api/og route (those should become permanent Blob URLs).
  const opps = await db.opportunity.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: { contains: '/api/og' } },
      ],
    },
    select: { id: true, category: true },
  })

  if (opps.length === 0) {
    return NextResponse.json({ updated: 0, message: 'All images are already static CDN URLs.' })
  }

  let updated = 0
  let failed = 0

  // Process in batches of 5 so we don't slam Vercel Blob or hit the
  // 60 s function timeout on large backlogs.
  const BATCH = 5
  for (let i = 0; i < opps.length; i += BATCH) {
    const batch = opps.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (opp: { id: string; category: string }) => {
        const typeParam = opp.category === 'JOB' ? 'job'
          : opp.category === 'INTERNSHIP' ? 'internship'
          : 'scholarship'
        const staticUrl = await generateAndStoreOpImage(opp.id, typeParam, APP_URL)
        if (staticUrl) {
          await db.opportunity.update({ where: { id: opp.id }, data: { imageUrl: staticUrl } })
          updated++
        } else {
          // Fall back to the dynamic URL — better than nothing
          const fallback = `${APP_URL}/api/og?id=${opp.id}&type=${typeParam}&simple=true`
          await db.opportunity.update({ where: { id: opp.id }, data: { imageUrl: fallback } })
          failed++
        }
      })
    )
  }

  return NextResponse.json({
    updated,
    failed,
    message: `${updated} images uploaded to CDN${failed > 0 ? `, ${failed} fell back to dynamic URL` : ''}.`,
  })
}
