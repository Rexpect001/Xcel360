import { cache } from 'react'
import prisma from '@/lib/prisma'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'
import { MIN_TOPIC_LISTINGS, SCHOLARSHIP_TOPICS, collapseVariants, type ScholarshipTopic } from '@/lib/scholarship-topics'

const DAY = 864e5

const listingSelect = {
  id: true, title: true, hostOrg: true, country: true, category: true, fundingType: true,
  deadline: true, field: true, fieldTags: true, programLevel: true, eligibility: true,
  featured: true, createdAt: true, updatedAt: true, applicationLink: true,
} as const

/**
 * Every live scholarship, deduplicated by title (the listing page does the same),
 * featured first, then soonest deadline, rolling deadlines last.
 * One query per render; topic matching happens in memory (a few hundred rows).
 * Database errors are thrown so an error page is never cached by ISR.
 */
export const getLiveScholarships = cache(async () => {
  const rows = await prisma.opportunity.findMany({
    where: liveOpportunityWhere({ category: 'SCHOLARSHIP' }),
    orderBy: [{ featured: 'desc' }, { deadline: { sort: 'asc', nulls: 'last' } }],
    select: listingSelect,
  })
  const seen = new Set<string>()
  return rows.filter((o) => {
    const key = o.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

export type LiveScholarship = Awaited<ReturnType<typeof getLiveScholarships>>[number]

export interface TopicStats {
  total: number
  fullyFunded: number
  closingIn30: number
  rolling: number
  nextDeadline: Date | null
  lastUpdated: Date | null
}

export function topicStats(listings: LiveScholarship[]): TopicStats {
  const now = Date.now()
  const dated = listings.filter((o) => o.deadline).map((o) => o.deadline as Date)
  return {
    total: listings.length,
    fullyFunded: listings.filter((o) => /full/i.test(o.fundingType)).length,
    closingIn30: dated.filter((d) => d.getTime() - now <= 30 * DAY).length,
    rolling: listings.length - dated.length,
    nextDeadline: dated.length ? new Date(Math.min(...dated.map((d) => d.getTime()))) : null,
    lastUpdated: listings.length ? new Date(Math.max(...listings.map((o) => o.updatedAt.getTime()))) : null,
  }
}

/** Live programme count for every topic (specialisation variants counted once). */
export async function topicCounts(): Promise<Map<string, number>> {
  const all = await getLiveScholarships()
  return new Map(SCHOLARSHIP_TOPICS.map((t) => [t.slug, collapseVariants(all.filter(t.match)).length]))
}

/** Topics with enough live listings to be worth indexing and linking. */
export function isIndexable(count: number) {
  return count >= MIN_TOPIC_LISTINGS
}

export async function listingsForTopic(topic: ScholarshipTopic) {
  return collapseVariants((await getLiveScholarships()).filter(topic.match))
}
