export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import OpportunitiesClient from '@/components/opportunities/OpportunitiesClient'
import prisma from '@/lib/prisma'

async function getOpportunities() {
  try {
    return await prisma.opportunity.findMany({
      where: { status: 'OPEN' },
      orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
    })
  } catch {
    return []
  }
}

export const metadata = {
  title: 'Scholarship Opportunities — Xcel360',
  description: 'Browse 500+ scholarships filtered by level, field, country, and funding type.',
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Scholarship Opportunities
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
