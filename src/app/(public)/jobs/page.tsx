export const revalidate = 3600

import type { Metadata } from 'next'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import JobsClient from '@/components/jobs/JobsClient'
import AdSlot from '@/components/ads/AdSlot'
import { opportunityListSelect } from '@/types/opportunity-list'

export const metadata: Metadata = {
  title: 'Jobs & Careers',
  description: 'Browse full-time jobs, remote positions, and career opportunities tailored for African professionals. Filter by field, country, and experience level.',
  keywords: ['jobs for Africans', 'African professionals', 'remote jobs Africa', 'career opportunities', 'tech jobs Nigeria'],
  alternates: { canonical: '/jobs' },
  openGraph: {
    title: 'Jobs & Careers - Xcel360',
    description: 'Browse full-time jobs and career opportunities for African professionals.',
    url: '/jobs',
  },
}

async function getJobs() {
  try {
    const all = await prisma.opportunity.findMany({
      where: { status: 'OPEN', category: 'JOB' },
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
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Jobs & Careers</h1>
          <p className="text-emerald-200 text-lg">{jobs.length} open positions across multiple countries</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <AdSlot placement="jobs-top" compact />
      </div>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <JobsClient initialJobs={jobs} mode="jobs" />
      </Suspense>
    </div>
  )
}
