import type { OpportunityListItem } from '@/types/opportunity-list'

/**
 * Google-style keyword search shared by every opportunity listing (scholarships,
 * jobs, internships): no field is required, so a free-text query is tokenized
 * and matched across every searchable attribute - title, org, country, field,
 * level, funding/job type, skills, and the full description and eligibility
 * text - then weighted by where the hit landed so a title match outranks a
 * passing mention buried in a paragraph.
 */
export function tokenizeQuery(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 1)
}

export function searchScore(o: OpportunityListItem, keywords: string[]): number {
  const title = o.title.toLowerCase()
  const hostOrg = (o.hostOrg ?? '').toLowerCase()
  const company = (o.company ?? '').toLowerCase()
  const country = (o.country ?? '').toLowerCase()
  const field = (o.field ?? '').toLowerCase()
  const fundingType = (o.fundingType ?? '').toLowerCase()
  const jobType = (o.jobType ?? '').toLowerCase()
  const experienceLevel = (o.experienceLevel ?? '').toLowerCase()
  const levels = o.programLevel.join(' ').toLowerCase()
  const tags = o.fieldTags.join(' ').toLowerCase()
  const skills = (o.skills ?? []).join(' ').toLowerCase()
  const description = (o.description ?? '').toLowerCase()
  const eligibility = (o.eligibility ?? '').toLowerCase()

  let score = 0
  for (const kw of keywords) {
    if (title.includes(kw)) score += 6
    if (tags.includes(kw) || skills.includes(kw)) score += 4
    if (hostOrg.includes(kw) || company.includes(kw)) score += 3
    if (
      country.includes(kw) ||
      field.includes(kw) ||
      levels.includes(kw) ||
      fundingType.includes(kw) ||
      jobType.includes(kw) ||
      experienceLevel.includes(kw)
    ) score += 3
    if (description.includes(kw) || eligibility.includes(kw)) score += 1
  }
  return score
}
