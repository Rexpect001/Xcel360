import Link from 'next/link'
import { getTopic, type ScholarshipTopic } from '@/lib/scholarship-topics'

/** Topics with the most live listings; linked from the main scholarships page. */
const POPULAR = [
  'fully-funded-masters-scholarships',
  'scholarships-in-europe',
  'fully-funded-phd-scholarships',
  'scholarships-in-uk',
  'scholarships-in-usa',
  'engineering-scholarships',
  'computer-science-and-ai-scholarships',
  'public-health-and-medicine-scholarships',
  'environment-and-climate-scholarships',
  'agriculture-scholarships',
]

export default function PopularTopics() {
  const topics = POPULAR.map(getTopic).filter((t): t is ScholarshipTopic => !!t)
  return (
    <section aria-labelledby="popular-topics" className="bg-white border-t border-surface-200 px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <h2 id="popular-topics" className="text-lg font-bold text-ink-900">Popular searches</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {topics.map((t) => (
            <Link key={t.slug} href={`/scholarships/${t.slug}`} className="px-3.5 py-2 rounded-full bg-surface-50 border border-surface-200 text-sm font-medium text-ink-700 hover:border-brand-300 hover:text-brand-700">
              {t.h1}
            </Link>
          ))}
          <Link href="/scholarships" className="px-3.5 py-2 rounded-full text-sm font-semibold text-brand-700 hover:underline">All topics →</Link>
        </div>
      </div>
    </section>
  )
}
