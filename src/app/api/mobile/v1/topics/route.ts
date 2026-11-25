export const dynamic = 'force-dynamic'
import { ok, preflight } from '@/lib/mobile/http'
import { SCHOLARSHIP_TOPICS } from '@/lib/scholarship-topics'
import { isIndexable, topicCounts } from '@/lib/scholarship-topics-data'

export const OPTIONS = preflight

/** GET the topic pages with live programme counts (only topics with enough listings). */
export async function GET() {
  const counts = await topicCounts()
  const topics = SCHOLARSHIP_TOPICS
    .filter((t) => isIndexable(counts.get(t.slug) ?? 0))
    .map((t) => ({ slug: t.slug, kind: t.kind, label: t.label, title: t.h1, count: counts.get(t.slug) ?? 0 }))
  return ok(topics)
}
