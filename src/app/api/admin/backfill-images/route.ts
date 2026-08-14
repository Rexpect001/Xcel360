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
          // Fall back to the dynamic URL  -  better than nothing
          const fallback = `${APP_URL}/api/og?id=${opp.id}&type=${typeParam}&simple=true`
          await db.opportunity.update({ where: { id: opp.id }, data: { imageUrl: fallback } })
          failed++
        }
      })
    )
  }

  // Same treatment for events  -  they were never backfilled before because
  // this route only handled the Opportunity table.
  const events = await db.event.findMany({
    where: {
      OR: [
        { coverImage: null },
        { coverImage: { contains: '/api/og' } },
      ],
    },
    select: { id: true },
  })

  let eventsUpdated = 0
  let eventsFailed = 0
  for (let i = 0; i < events.length; i += BATCH) {
    const batch = events.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (ev: { id: string }) => {
        const staticUrl = await generateAndStoreOpImage(ev.id, 'event', APP_URL)
        if (staticUrl) {
          await db.event.update({ where: { id: ev.id }, data: { coverImage: staticUrl } })
          eventsUpdated++
        } else {
          eventsFailed++
        }
      })
    )
  }

  return NextResponse.json({
    opportunities: { updated, failed },
    events: { updated: eventsUpdated, failed: eventsFailed },
    message: `${updated} opportunity image(s) and ${eventsUpdated} event cover(s) uploaded to CDN.`,
  })
}
