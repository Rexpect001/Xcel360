// ISR: served from cache, refreshed at most every 5 minutes (see src/lib/isr.ts)
export const revalidate = 300
// Nothing is prerendered at build (no database there); each topic renders on
// its first visit and is then cached like the other listing pages.
export function generateStaticParams() {
  return []
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CalendarClock, CheckCircle2, Clock, GraduationCap, Sparkles } from 'lucide-react'
import PageHero from '@/components/layout/PageHero'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import GoogleAd from '@/components/ads/GoogleAd'
import JsonLd from '@/components/seo/JsonLd'
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import { formatDate } from '@/lib/utils'
import { SITE_URL, breadcrumbLd } from '@/lib/seo/structured-data'
import { getTopic, type ScholarshipTopic } from '@/lib/scholarship-topics'
import { isIndexable, listingsForTopic, topicCounts, topicStats, type TopicStats } from '@/lib/scholarship-topics-data'

/** Cards shown on one page; larger topics point to search for the rest. */
const SHOWN = 60

export async function generateMetadata({ params }: { params: { topic: string } }): Promise<Metadata> {
  const topic = getTopic(params.topic)
  if (!topic) return { title: 'Scholarships' }
  const count = (await listingsForTopic(topic).catch(() => [])).length
  const path = `/scholarships/${topic.slug}`
  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: path },
    // Too few live listings to be useful from search: keep it out of the index for now.
    ...(!isIndexable(count) && { robots: { index: false, follow: true } }),
    openGraph: { title: `${topic.h1} - Xcel360`, description: topic.description, url: path, type: 'website', images: [DEFAULT_OG_IMAGE] },
    twitter: { card: 'summary_large_image', title: topic.h1, description: topic.description, images: [DEFAULT_OG_IMAGE.url] },
  }
}

function faq(s: TopicStats): { q: string; a: string }[] {
  const today = formatDate(new Date())
  return [
    {
      q: 'How many of these scholarships are open right now?',
      a: s.total === 0
        ? `None are open on Xcel360 as of ${today}. New listings are added often, so check back or browse related topics below.`
        : `${s.total} ${s.total === 1 ? 'listing is' : 'listings are'} open on Xcel360 as of ${today}, ${s.fullyFunded} of them fully funded. ${s.closingIn30} ${s.closingIn30 === 1 ? 'closes' : 'close'} within the next 30 days.`,
    },
    {
      q: 'When is the next deadline?',
      a: s.nextDeadline
        ? `The next deadline in this list is ${formatDate(s.nextDeadline)}.${s.rolling ? ` ${s.rolling} ${s.rolling === 1 ? 'listing accepts' : 'listings accept'} applications on a rolling basis.` : ''} Each listing shows its own deadline.`
        : s.rolling
          ? 'The open listings here accept applications on a rolling basis, so apply as early as you can.'
          : 'There are no open deadlines in this list right now.',
    },
    {
      q: 'Can African students apply?',
      a: 'Xcel360 lists scholarships that African students can apply for, but every scholarship sets its own rules on nationality, age, previous degrees and language tests. Read the eligibility section of each listing before you apply.',
    },
    {
      q: 'How do I keep track of deadlines?',
      a: 'Create a free Xcel360 account and save the scholarships you want. We send reminders 30, 14, 7 and 2 days before each deadline.',
    },
  ]
}

export default async function ScholarshipTopicPage({ params }: { params: { topic: string } }) {
  const topic = getTopic(params.topic)
  if (!topic) notFound()

  const [listings, counts] = await Promise.all([listingsForTopic(topic), topicCounts()])
  const stats = topicStats(listings)
  const shown = listings.slice(0, SHOWN)
  const related = topic.related
    .map((slug) => getTopic(slug))
    .filter((t): t is ScholarshipTopic => !!t && isIndexable(counts.get(t.slug) ?? 0))
  const questions = faq(stats)
  const path = `/scholarships/${topic.slug}`

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: topic.h1,
    description: topic.description,
    url: `${SITE_URL}${path}`,
    ...(stats.lastUpdated && { dateModified: stats.lastUpdated.toISOString() }),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: listings.length,
      itemListElement: shown.slice(0, 25).map((o, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/opportunities/${o.id}`,
        name: o.title,
      })),
    },
  }

  const tiles = [
    { icon: GraduationCap, value: stats.total, label: 'Open now' },
    { icon: Sparkles, value: stats.fullyFunded, label: 'Fully funded' },
    { icon: Clock, value: stats.closingIn30, label: 'Close within 30 days' },
    { icon: CalendarClock, value: stats.nextDeadline ? formatDate(stats.nextDeadline) : stats.rolling ? 'Rolling' : '-', label: 'Next deadline' },
  ]

  return (
    <div className="min-h-screen bg-surface-50">
      <JsonLd data={[collectionLd, breadcrumbLd([{ name: 'Scholarships', path: '/scholarships' }, { name: topic.h1, path }])]} />
      <PageHero eyebrow="Scholarships" title={topic.h1} subtitle={topic.description}>
        <nav aria-label="Breadcrumb" className="mt-6 text-sm text-brand-100">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2" aria-hidden>/</span>
          <Link href="/scholarships" className="hover:text-white">Scholarships</Link>
          <span className="mx-2" aria-hidden>/</span>
          <span className="text-white">{topic.label}</span>
        </nav>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Live numbers */}
        <section aria-label="At a glance" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map(({ icon: Icon, value, label }) => (
            <div key={label} className="paper-card p-4 sm:p-5">
              <Icon className="h-5 w-5 text-brand-600" aria-hidden />
              <p className="mt-2 text-2xl font-bold text-ink-900 tabular-nums">{value}</p>
              <p className="text-xs text-ink-500">{label}</p>
            </div>
          ))}
        </section>

        {/* Guidance */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 text-ink-700 leading-relaxed">
            <h2 className="font-display text-2xl text-ink-900">What to know</h2>
            {topic.intro.map((p) => <p key={p}>{p}</p>)}
          </div>
          <aside className="paper-card p-5 sm:p-6">
            <h2 className="font-bold text-ink-900">Tips before you apply</h2>
            <ul className="mt-3 space-y-3 text-sm text-ink-700">
              {topic.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link href="/dashboard/tools" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
              Free CV and SOP tools <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </section>

        <GoogleAd placement="listing-top" shape="leaderboard" />

        {/* Listings */}
        <section aria-labelledby="listings-heading">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-5">
            <h2 id="listings-heading" className="font-display text-2xl text-ink-900">
              {stats.total > 0 ? `${stats.total} open ${stats.total === 1 ? 'scholarship' : 'scholarships'}` : 'No open scholarships right now'}
            </h2>
            {stats.lastUpdated && <p className="text-xs text-ink-500">Last updated {formatDate(stats.lastUpdated)}</p>}
          </div>
          {shown.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shown.map((o) => <OpportunityCard key={o.id} opp={o} />)}
            </div>
          ) : (
            <div className="paper-card p-8 text-center text-ink-600">
              <p>Nothing in this category is open at the moment. New scholarships are added every week.</p>
              <Link href="/opportunities" className="btn-primary mt-4 inline-flex">Browse all scholarships</Link>
            </div>
          )}
          {listings.length > SHOWN && (
            <p className="mt-6 text-sm text-ink-600">
              Showing the first {SHOWN} of {listings.length}.{' '}
              <Link href="/opportunities" className="font-semibold text-brand-700 hover:underline">Search all scholarships</Link> to narrow them down.
            </p>
          )}
        </section>

        {/* Related topics */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-bold text-ink-900 mb-3">Related searches</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((t) => (
                <Link key={t.slug} href={`/scholarships/${t.slug}`} className="px-3.5 py-2 rounded-full bg-white border border-surface-200 text-sm font-medium text-ink-700 hover:border-brand-300 hover:text-brand-700">
                  {t.h1}
                </Link>
              ))}
              <Link href="/scholarships" className="px-3.5 py-2 rounded-full text-sm font-semibold text-brand-700 hover:underline">All topics →</Link>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="max-w-3xl">
          <h2 id="faq-heading" className="font-display text-2xl text-ink-900 mb-4">Common questions</h2>
          <div className="space-y-3">
            {questions.map(({ q, a }) => (
              <details key={q} className="paper-card p-5 group" open>
                <summary className="cursor-pointer font-semibold text-ink-900">{q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
