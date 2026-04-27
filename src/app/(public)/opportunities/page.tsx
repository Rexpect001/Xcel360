export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import OpportunitiesClient from '@/components/opportunities/OpportunitiesClient'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Scholarships & Funding Opportunities',
  description:
    'Browse hundreds of fully funded scholarships, grants, and fellowships for African students. Filter by country, funding type, and deadline to find the right opportunity.',
  keywords: [
    'fully funded scholarships',
    'scholarships for Africans',
    'study abroad 2025',
    'undergraduate scholarships',
    'postgraduate scholarships',
    'PhD scholarships',
    'scholarship deadlines',
    'grants for students',
  ],
  alternates: { canonical: '/opportunities' },
  openGraph: {
    title: 'Scholarships & Funding Opportunities — Xcel360',
    description: 'Browse hundreds of fully funded scholarships, grants, and fellowships for African students.',
    url: '/opportunities',
  },
}


async function getOpportunities() {
  try {
    const all = await (prisma as any).opportunity.findMany({
      where: { status: 'OPEN' },
      orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
    })
    // Deduplicate by normalised title — keep first occurrence (featured/soonest deadline first)
    const seen = new Set<string>()
    return all.filter((o: any) => {
      const key = o.title.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch {
    return []
  }
}


export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Opportunities
          </h1>
          <p className="text-blue-200 text-lg">
            {opportunities.length} opportunities across 50+ countries
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <OpportunitiesClient initialOpportunities={opportunities} />
      </Suspense>
    </div>
  )
}
