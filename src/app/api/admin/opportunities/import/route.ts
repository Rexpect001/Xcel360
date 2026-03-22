export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const rows: any[] = await req.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    // ── Dedup within incoming batch (remove duplicate titles in the file itself) ──
    const seenInBatch = new Set<string>()
    const uniqueRows = rows.filter((r: any) => {
      const t = r.title?.toLowerCase().trim()
      if (!t || seenInBatch.has(t)) return false
      seenInBatch.add(t)
      return true
    })

    // ── Dedup: fetch existing titles and filter out matches ──
    const existing = await prisma.opportunity.findMany({
      where: { title: { in: uniqueRows.map((r: any) => r.title).filter(Boolean) } },
      select: { title: true },
    })
    const existingTitles = new Set(existing.map((e: any) => e.title.toLowerCase().trim()))

    const deduped = uniqueRows.filter((r: any) => {
      const t = r.title?.toLowerCase().trim()
      return t && !existingTitles.has(t)
    })
    const duplicates = rows.length - deduped.length

    if (deduped.length === 0) {
      return NextResponse.json({ created: 0, failed: 0, duplicates, errors: [] })
    }

    let created = 0
    let failed = 0
    const errors: string[] = []

    // Batch createMany in groups of 50
    const BATCH = 50
    for (let i = 0; i < deduped.length; i += BATCH) {
      const batch = deduped.slice(i, i + BATCH)
      try {
        const result = await prisma.opportunity.createMany({ data: batch, skipDuplicates: true })
        created += result.count
      } catch {
        // Fall back to row-by-row
        for (const row of batch) {
          try {
            await prisma.opportunity.create({ data: row })
            created++
          } catch (rowErr: any) {
            failed++
            errors.push(rowErr?.message ?? 'Unknown error')
          }
        }
      }
    }

    return NextResponse.json({ created, failed, duplicates, errors: errors.slice(0, 10) })
  } catch (err) {
    console.error('[import]', err)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
