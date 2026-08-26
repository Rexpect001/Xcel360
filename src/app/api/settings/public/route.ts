import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Safe, public site settings — consumed by the announcement bar and footer.
// NEVER return admin-only or sensitive keys here.
const PUBLIC_KEYS = [
  'announcement_enabled',
  'announcement_text',
  'announcement_link',
  'announcement_link_label',
  'contact_email',
] as const

export async function GET() {
  const db = prisma as any
  const rows = await db.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_KEYS] } },
    select: { key: true, value: true },
  })

  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value

  return NextResponse.json(
    {
      announcement: {
        enabled: map.announcement_enabled === 'true',
        text: map.announcement_text ?? '',
        link: map.announcement_link ?? '',
        linkLabel: map.announcement_link_label ?? 'Learn more',
      },
      contactEmail: map.contact_email || 'hello@thexcel360.com',
    },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}
