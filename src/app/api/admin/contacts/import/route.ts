export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface ContactRow { email: string; name?: string }

// POST  -  bulk upsert contacts (from Excel import or any source)
export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { contacts, source = 'import' }: { contacts: ContactRow[]; source?: string } = await req.json()

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
  }

  // Normalise + deduplicate within the payload
  const seen = new Set<string>()
  const rows = contacts
    .map(c => ({ email: c.email?.toLowerCase().trim(), name: c.name?.trim() || undefined }))
    .filter(c => {
      if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return false
      if (seen.has(c.email)) return false
      seen.add(c.email)
      return true
    })

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid email addresses found in the file' }, { status: 400 })
  }

  const db = prisma as any

  // Upsert: update name/source if email already exists, otherwise insert
  let created = 0
  let updated = 0

  for (const row of rows) {
    const existing = await db.contact.findUnique({ where: { email: row.email } })
    if (existing) {
      await db.contact.update({
        where: { email: row.email },
        data: { name: row.name ?? existing.name, updatedAt: new Date() },
      })
      updated++
    } else {
      await db.contact.create({ data: { email: row.email, name: row.name, source } })
      created++
    }
  }

  return NextResponse.json({ ok: true, created, updated, total: rows.length })
}
