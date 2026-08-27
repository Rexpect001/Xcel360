export const revalidate = 3600

import type { Metadata } from 'next'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import JobsClient from '@/components/jobs/JobsClient'
import AdSlot from '@/components/ads/AdSlot'
import PageHero from '@/components/layout/PageHero'
import { opportunityListSelect } from '@/types/opportunity-list'

export const metadata: Metadata = {
  title: 'Internships',
  description: 'Browse internship opportunities worldwide for African students and graduates. Filter by field, country, and experience level.',
  keywords: ['internships for Africans', 'student internships', 'graduate internships Africa', 'internship opportunities'],
  alternates: { canonical: '/internships' },
  openGraph: {
    title: 'Internships - Xcel360',
    description: 'Browse internship opportunities for African students and graduates.',
    url: '/internships',
  },
}

async function getInternships() {
  try {
    const all = await prisma.opportunity.findMany({
      where: { status: 'OPEN', category: 'INTERNSHIP' },
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
    console.error('[internships/page] Failed to load internships', error)
    return []
  }
}

export default async function InternshipsPage() {
  const internships = await getInternships()
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        eyebrow="Early Careers"
        title="Internships"
        subtitle={`${internships.length} internship positions available worldwide`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <AdSlot placement="internships-top" compact />
      </div>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <JobsClient initialJobs={internships} mode="internships" />
      </Suspense>
    </div>
  )
}
