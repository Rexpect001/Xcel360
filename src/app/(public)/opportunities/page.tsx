export const revalidate = 3600

import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import OpportunitiesClient from '@/components/opportunities/OpportunitiesClient'
import GoogleAd from '@/components/ads/GoogleAd'
import PageHero from '@/components/layout/PageHero'
import CategoryBrowse from '@/components/landing/CategoryBrowse'
import prisma from '@/lib/prisma'
import { opportunityListSelect } from '@/types/opportunity-list'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'

export const metadata: Metadata = {
  title: 'Scholarships & Funding Opportunities',
  description:
    'Browse hundreds of fully funded scholarships, grants, and fellowships for African students. Filter by country, funding type, and deadline to find the right opportunity.',
  keywords: [
    'fully funded scholarships',
    'scholarships for Africans',
    'study abroad scholarships',
    'undergraduate scholarships',
    'postgraduate scholarships',
    'PhD scholarships',
    'scholarship deadlines',
    'grants for students',
  ],
  alternates: { canonical: '/opportunities' },
  openGraph: {
    title: 'Scholarships & Funding Opportunities - Xcel360',
    description: 'Browse hundreds of fully funded scholarships, grants, and fellowships for African students.',
    url: '/opportunities',
  },
}

async function getOpportunities() {
  try {
    const all = await prisma.opportunity.findMany({
      where: liveOpportunityWhere(),
      orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
      take: 300,
      select: opportunityListSelect,
    })

    const seen = new Set<string>()
    return all.filter((o) => {
      const key = o.title.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error('[opportunities/page] Failed to load opportunities', error)
    return []
  }
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Scholarships and funding opportunities for African students',
    description: metadata.description,
    url: '/opportunities',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opportunities.slice(0, 25).map((opp, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `/opportunities/${opp.id}`,
        name: opp.title,
      })),
    },
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="Funding"
        title="Scholarships & Opportunities"
        subtitle="Every listing is checked for a live deadline and an official way to apply. Search by keyword, then narrow by level, country and funding."
      >
        <Link href="/how-to-search" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-200 hover:text-white">
          New here? Watch the 60-second search walkthrough →
        </Link>
      </PageHero>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <GoogleAd placement="listing-top" shape="leaderboard" />
      </div>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <OpportunitiesClient initialOpportunities={opportunities} />
      </Suspense>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <GoogleAd placement="listing-top" shape="leaderboard" />
      </div>
      <CategoryBrowse />
      <section className="bg-white border-t border-surface-200 px-4 py-10">
        <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Find scholarships faster</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Filter by study level, country, funding type, and field so you can focus on scholarships that fit your plan.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Track deadlines clearly</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Save opportunities to your dashboard and get reminders before important application dates pass.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Get better matches</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Complete your profile to help Xcel360 recommend scholarships for your level, target countries, and field.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
