import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { memo, PUBLIC_SETTINGS_CACHE_KEY } from '@/lib/memo'

// This endpoint reads runtime database settings. Building the container must
// not require production database credentials or bake those settings in.
export const dynamic = 'force-dynamic'

// Safe, public site settings - consumed by the announcement bar and footer.
// NEVER return admin-only or sensitive keys here.
const PUBLIC_KEYS = [
  'announcement_enabled',
  'announcement_text',
  'announcement_link',
  'announcement_link_label',
  'contact_email',
  'ad_home_enabled',
  'ad_home_title',
  'ad_home_text',
  'ad_home_link',
  'ad_home_cta',
  'ad_home_image',
  'edifier_ad_enabled',
] as const

async function loadSettings() {
  const db = prisma as any
  const rows = await db.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_KEYS] } },
    select: { key: true, value: true },
  })
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value
  return map
}

export async function GET() {
  // Every public page view calls this endpoint, so the database is read at
  // most once per 30 seconds per server, and concurrent misses share one query.
  const map = await memo(PUBLIC_SETTINGS_CACHE_KEY, 30_000, loadSettings)

  return NextResponse.json(
    {
      announcement: {
        enabled: map.announcement_enabled === 'true',
        text: map.announcement_text ?? '',
        link: map.announcement_link ?? '',
        linkLabel: map.announcement_link_label ?? 'Learn more',
      },
      homeAd: {
        enabled: map.ad_home_enabled === 'true',
        title: map.ad_home_title ?? '',
        text: map.ad_home_text ?? '',
        link: map.ad_home_link ?? '',
        cta: map.ad_home_cta ?? 'Learn more',
        image: map.ad_home_image ?? '',
      },
      contactEmail: map.contact_email || 'hello@thexcel360.com',
      edifierAdEnabled: map.edifier_ad_enabled === 'true',
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } }
  )
}
