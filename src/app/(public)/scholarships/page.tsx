// ISR: served from cache, refreshed at most every 5 minutes (see src/lib/isr.ts)
export const revalidate = 300

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PageHero from '@/components/layout/PageHero'
import JsonLd from '@/components/seo/JsonLd'
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import { shortenCacheAfterDbFailure } from '@/lib/isr'
import { SITE_URL, breadcrumbLd } from '@/lib/seo/structured-data'
import { SCHOLARSHIP_TOPICS, TOPIC_KIND_LABEL, type TopicKind } from '@/lib/scholarship-topics'
import { isIndexable, topicCounts } from '@/lib/scholarship-topics-data'

export const metadata: Metadata = {
  title: 'Scholarships by Level, Country and Field',
  description: "Browse open scholarships for African students by topic: fully funded master's and PhD, study in the UK, USA, Europe and more, or by field.",
  alternates: { canonical: '/scholarships' },
  openGraph: {
    title: 'Scholarships by Level, Country and Field - Xcel360',
    description: 'Browse open scholarships for African students by level, destination and field of study.',
    url: '/scholarships',
    images: [DEFAULT_OG_IMAGE],
  },
}

async function getCounts() {
  try {
    return await topicCounts()
  } catch (error) {
    await shortenCacheAfterDbFailure('scholarship-topics', error)
    return new Map<string, number>()
  }
}

const KINDS: TopicKind[] = ['level', 'country', 'field']

export default async function ScholarshipTopicsHub() {
  const counts = await getCounts()
  // Only link topics with enough live listings; thin pages stay out of reach.
  const visible = SCHOLARSHIP_TOPICS.filter((t) => isIndexable(counts.get(t.slug) ?? 0))

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Scholarships by level, country and field',
    url: `${SITE_URL}/scholarships`,
    hasPart: visible.map((t) => ({ '@type': 'CollectionPage', name: t.h1, url: `${SITE_URL}/scholarships/${t.slug}` })),
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <JsonLd data={[ld, breadcrumbLd([{ name: 'Scholarships', path: '/scholarships' }])]} />
      <PageHero
        eyebrow="Scholarships"
        title="Scholarships by level, country and field"
        subtitle="Pick the kind of scholarship you are looking for. Every page shows live listings only, with real deadlines."
      >
        <Link href="/opportunities" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-200 hover:text-white">
          Or search every open scholarship <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {visible.length === 0 && (
          <div className="paper-card p-8 text-center text-ink-600">
            <p>Topics are loading. Meanwhile, you can search every open scholarship.</p>
            <Link href="/opportunities" className="btn-primary mt-4 inline-flex">Browse all scholarships</Link>
          </div>
        )}
        {KINDS.map((kind) => {
          const topics = visible.filter((t) => t.kind === kind)
          if (!topics.length) return null
          return (
            <section key={kind} aria-labelledby={`hub-${kind}`}>
              <h2 id={`hub-${kind}`} className="font-display text-2xl text-ink-900 mb-4">{TOPIC_KIND_LABEL[kind]}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((t) => (
                  <Link key={t.slug} href={`/scholarships/${t.slug}`} className="group paper-card p-5 hover:border-brand-200 hover:shadow-premium transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-ink-900 group-hover:text-brand-700">{t.h1}</h3>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-300 group-hover:text-brand-700" />
                    </div>
                    <p className="mt-2 text-sm text-ink-500">
                      <span className="font-semibold text-ink-700 tabular-nums">{counts.get(t.slug)}</span> open now
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
