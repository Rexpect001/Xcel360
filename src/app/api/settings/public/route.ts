import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 300

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
