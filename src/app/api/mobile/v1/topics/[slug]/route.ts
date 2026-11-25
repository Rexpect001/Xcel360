export const dynamic = 'force-dynamic'
import { fail, ok, preflight } from '@/lib/mobile/http'
import { getTopic } from '@/lib/scholarship-topics'
import { listingsForTopic, topicStats } from '@/lib/scholarship-topics-data'
import { toCard } from '@/lib/mobile/listings'

export const OPTIONS = preflight

/** GET one topic: guidance, live stats and its listings (variants collapsed, as on the website). */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const topic = getTopic(params.slug)
  if (!topic) return fail('Topic not found.', 404)
  const listings = await listingsForTopic(topic)
  const s = topicStats(listings)
  return ok({
    slug: topic.slug,
    kind: topic.kind,
    title: topic.h1,
    description: topic.description,
    intro: topic.intro,
    tips: topic.tips,
    related: topic.related.map((slug) => getTopic(slug)).filter(Boolean).map((t) => ({ slug: t!.slug, label: t!.label })),
    stats: { ...s, nextDeadline: s.nextDeadline?.toISOString() ?? null, lastUpdated: s.lastUpdated?.toISOString() ?? null },
    listings: listings.slice(0, 60).map((o) => toCard({ ...o, company: null, remote: false, jobType: null })),
  })
}
