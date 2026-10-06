export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseDeadline } from '@/lib/utils'
import { revalidateOpportunityPages } from '@/lib/revalidate-opportunities'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const rawRows: any[] = await req.json()

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    // Normalise deadlines up front so year-less dates never land as 2001
    const rows = rawRows.map((r: any) => ({ ...r, deadline: parseDeadline(r?.deadline) }))

    // ── Dedup within incoming batch by title+deadline ──
    const seenInBatch = new Set<string>()
    const uniqueRows = rows.filter((r: any) => {
      const key = `${r.title?.toLowerCase().trim()}|${r.deadline ? r.deadline.toISOString().split('T')[0] : ''}`
      if (!r.title?.trim() || seenInBatch.has(key)) return false
      seenInBatch.add(key)
      return true
    })

    // ── Dedup against DB: fetch existing title+deadline combos ──
    const db = prisma as any
    const existing = await db.opportunity.findMany({
      where: { title: { in: uniqueRows.map((r: any) => r.title).filter(Boolean) } },
      select: { title: true, deadline: true },
    })
    const existingKeys = new Set(
      existing.map((e: any) => `${e.title.toLowerCase().trim()}|${e.deadline ? new Date(e.deadline).toISOString().split('T')[0] : ''}`)
    )

    const deduped = uniqueRows.filter((r: any) => {
      const deadlineStr = r.deadline ? new Date(r.deadline).toISOString().split('T')[0] : ''
      const key = `${r.title?.toLowerCase().trim()}|${deadlineStr}`
      return !existingKeys.has(key)
    })
    const duplicates = rows.length - deduped.length

    if (deduped.length === 0) {
      return NextResponse.json({ created: 0, failed: 0, duplicates, errors: [] })
    }

    let created = 0
    let failed = 0
    const errors: string[] = []

    const BATCH = 50
    for (let i = 0; i < deduped.length; i += BATCH) {
      const batch = deduped.slice(i, i + BATCH)
      try {
        const result = await db.opportunity.createMany({ data: batch, skipDuplicates: true })
        created += result.count
      } catch {
        for (const row of batch) {
          try {
            await db.opportunity.create({ data: row })
            created++
          } catch (rowErr: any) {
            failed++
            errors.push(rowErr?.message ?? 'Unknown error')
          }
        }
      }
    }

    if (created > 0) revalidateOpportunityPages()
    return NextResponse.json({ created, failed, duplicates, errors: errors.slice(0, 10) })
  } catch (err) {
    console.error('[import]', err)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
