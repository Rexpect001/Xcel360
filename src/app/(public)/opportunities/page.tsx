export const revalidate = 3600

import type { Metadata } from 'next'
import { Suspense } from 'react'
import OpportunitiesClient from '@/components/opportunities/OpportunitiesClient'
import AdSlot from '@/components/ads/AdSlot'
import PageHero from '@/components/layout/PageHero'
import CategoryBrowse from '@/components/landing/CategoryBrowse'
import prisma from '@/lib/prisma'
import { opportunityListSelect } from '@/types/opportunity-list'

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
      where: { status: 'OPEN' },
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
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="Funding"
        title="Scholarships & Opportunities"
        subtitle="Search scholarships, grants, fellowships, jobs, and internships from trusted sources."
      />
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <OpportunitiesClient initialOpportunities={opportunities} />
      </Suspense>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <AdSlot placement="opportunities-bottom" compact />
      </div>
      <CategoryBrowse />
      <section className="bg-white border-t border-gray-100 px-4 py-10">
        <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Find scholarships faster</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Filter by study level, country, funding type, and field so you can focus on scholarships that fit your plan.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Track deadlines clearly</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Save opportunities to your dashboard and get reminders before important application dates pass.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Get better matches</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Complete your profile to help Xcel360 recommend scholarships for your level, target countries, and field.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
