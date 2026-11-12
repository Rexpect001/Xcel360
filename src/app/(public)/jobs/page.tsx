export const revalidate = 3600

import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import JobsClient from '@/components/jobs/JobsClient'
import GoogleAd from '@/components/ads/GoogleAd'
import PageHero from '@/components/layout/PageHero'
import { opportunityListSelect } from '@/types/opportunity-list'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'

export const metadata: Metadata = {
  title: 'Jobs & Careers',
  description: 'Browse full-time jobs, remote positions, and career opportunities tailored for African professionals. Filter by field, country, and experience level.',
  keywords: ['jobs for Africans', 'African professionals', 'remote jobs Africa', 'career opportunities', 'tech jobs Nigeria'],
  alternates: { canonical: '/jobs' },
  openGraph: {
    title: 'Jobs & Careers - Xcel360',
    description: 'Browse full-time jobs and career opportunities for African professionals.',
    url: '/jobs',
    images: [DEFAULT_OG_IMAGE],
  },
}

async function getJobs() {
  try {
    const all = await prisma.opportunity.findMany({
      where: liveOpportunityWhere({ category: 'JOB' }),
      orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
      take: 250,
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
    console.error('[jobs/page] Failed to load jobs', error)
    return []
  }
}

export default async function JobsPage() {
  const jobs = await getJobs()
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        eyebrow="Careers"
        title="Jobs & Careers"
        subtitle={`${jobs.length} open positions across multiple countries`}
      />
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <JobsClient initialJobs={jobs} mode="jobs" />
      </Suspense>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <GoogleAd placement="listing-top" shape="leaderboard" />
      </div>
    </div>
  )
}
