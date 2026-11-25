export const dynamic = 'force-dynamic'
import { ok, preflight } from '@/lib/mobile/http'
import { applyFilters, intParam, isCategory, liveListings, paginate, toCard } from '@/lib/mobile/listings'

export const OPTIONS = preflight

/**
 * GET ?q=&category=SCHOLARSHIP|JOB|INTERNSHIP&level=masters&funded=1&soon=30&topic=slug&page=1&pageSize=20
 * Public, like the website listing pages.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const category = sp.get('category')
  const rows = await liveListings(isCategory(category) ? category : 'SCHOLARSHIP')
  const filtered = applyFilters(rows, {
    q: sp.get('q')?.slice(0, 120) ?? undefined,
    level: sp.get('level') ?? undefined,
    fullyFunded: sp.get('funded') === '1',
    soon: sp.get('soon') ? intParam(sp.get('soon'), 0) || undefined : undefined,
    topic: sp.get('topic') ?? undefined,
  })
  const { items, ...meta } = paginate(filtered, intParam(sp.get('page'), 1), intParam(sp.get('pageSize'), 20))
  return ok(items.map(toCard), meta)
}
