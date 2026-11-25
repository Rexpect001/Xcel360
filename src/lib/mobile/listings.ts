import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'
import { eligibilitySnippet, matchesLevel, monogram } from '@/lib/opportunity-display'
import { collapseVariants, getTopic } from '@/lib/scholarship-topics'

/**
 * Listing queries for the mobile API. Filters run in memory over the few
 * hundred live listings, with the same tolerant rules as the website (level
 * keyword families, topic matching), because the hand-entered data is too
 * inconsistent for exact database filters.
 */
export const listingSelect = {
  id: true, title: true, hostOrg: true, company: true, country: true, fundingType: true,
  deadline: true, field: true, fieldTags: true, programLevel: true, eligibility: true,
  featured: true, category: true, createdAt: true, applicationLink: true, remote: true, jobType: true,
} satisfies Prisma.OpportunitySelect

export type ListingRow = Prisma.OpportunityGetPayload<{ select: typeof listingSelect }>

export type Category = 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP'
export const isCategory = (v: unknown): v is Category => v === 'SCHOLARSHIP' || v === 'JOB' || v === 'INTERNSHIP'

/** The compact card the app renders in lists (a few hundred bytes each). */
export function toCard(o: ListingRow) {
  const org = o.company || o.hostOrg
  return {
    id: o.id,
    title: o.title,
    org,
    monogram: monogram(org),
    country: o.country,
    fundingType: o.fundingType,
    deadline: o.deadline?.toISOString() ?? null,
    programLevel: o.programLevel,
    category: o.category,
    featured: o.featured,
    remote: o.remote,
    jobType: o.jobType,
    snippet: eligibilitySnippet(o.eligibility, 120),
  }
}
export type ListingCard = ReturnType<typeof toCard>

export async function liveListings(category?: Category): Promise<ListingRow[]> {
  const rows = await prisma.opportunity.findMany({
    where: liveOpportunityWhere(category ? { category } : {}),
    orderBy: [{ featured: 'desc' }, { deadline: { sort: 'asc', nulls: 'last' } }],
    select: listingSelect,
  })
  // Same de-duplication as the website listing page
  const seen = new Set<string>()
  return rows.filter((o) => {
    const key = o.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export interface ListingFilters {
  q?: string
  level?: string
  fullyFunded?: boolean
  /** Only listings closing within this many days. */
  soon?: number
  topic?: string
}

/** Short forms students type, and what listings actually say. */
const ALIASES: Record<string, string[]> = {
  uk: ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain'],
  usa: ['usa', 'united states', 'u.s.'],
  us: ['usa', 'united states', 'u.s.'],
  america: ['america', 'united states', 'usa'],
  uae: ['uae', 'united arab emirates'],
  masters: ['master', 'msc', 'mba', 'llm'],
  master: ['master', 'msc', 'mba', 'llm'],
  phd: ['phd', 'ph.d', 'doctora'],
  undergraduate: ['undergrad', 'bachelor'],
  bachelors: ['undergrad', 'bachelor'],
}

/** Every word of the query must appear somewhere in the listing (title, org, place, field, level, eligibility). */
function matchesQuery(o: ListingRow, words: string[]) {
  if (!words.length) return true
  const hay = [o.title, o.hostOrg, o.company, o.country, o.field, o.fieldTags.join(' '), o.programLevel.join(' '), o.eligibility, o.jobType]
    .filter(Boolean).join(' ').toLowerCase()
  return words.every((w) => (ALIASES[w] ?? [w]).some((alt) => hay.includes(alt)))
}

const STOP = new Set(['scholarship', 'scholarships', 'in', 'for', 'the', 'and', 'of', 'a', 'to'])

export function applyFilters(rows: ListingRow[], f: ListingFilters): ListingRow[] {
  const words = (f.q ?? '').toLowerCase().split(/\s+/).map((w) => w.replace(/[.,;:!?()"“”[\]{}]/g, '')).filter((w) => w.length > 1 && !STOP.has(w))
  // "fully funded" in the query works like the filter
  const fullyFromQuery = /\bfully[\s-]?funded\b/i.test(f.q ?? '')
  const queryWords = fullyFromQuery ? words.filter((w) => w !== 'fully' && w !== 'funded') : words
  const topic = f.topic ? getTopic(f.topic) : undefined
  const cutoff = f.soon ? Date.now() + f.soon * 864e5 : null

  const filtered = rows.filter((o) =>
    matchesQuery(o, queryWords) &&
    (!f.level || matchesLevel(o.programLevel, f.level)) &&
    (!(f.fullyFunded || fullyFromQuery) || /full/i.test(o.fundingType)) &&
    (!cutoff || (o.deadline !== null && o.deadline.getTime() <= cutoff)) &&
    (!topic || topic.match(o)),
  )
  return topic ? collapseVariants(filtered) : filtered
}

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const size = Math.min(Math.max(pageSize, 1), 50)
  const p = Math.max(page, 1)
  const start = (p - 1) * size
  return { items: rows.slice(start, start + size), page: p, pageSize: size, total: rows.length, hasMore: start + size < rows.length }
}

export function intParam(v: string | null, fallback: number) {
  const n = Number.parseInt(v ?? '', 10)
  return Number.isFinite(n) ? n : fallback
}
