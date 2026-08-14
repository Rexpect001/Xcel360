import type { Opportunity, Profile } from '@prisma/client'

export type MatchableProfile = Pick<Profile, 'level' | 'targetCountries' | 'targetFields'> | null | undefined

export type MatchableOpportunity = Pick<
  Opportunity,
  | 'title'
  | 'programLevel'
  | 'field'
  | 'fieldTags'
  | 'country'
  | 'fundingType'
  | 'featured'
  | 'deadline'
>

export interface OpportunityMatch {
  score: number
  reasons: string[]
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().trim()
}

function includesAny(source: string[], targets: string[]): boolean {
  const sourceSet = new Set(source.map(normalize).filter(Boolean))
  return targets.map(normalize).filter(Boolean).some((target) => sourceSet.has(target))
}

export function profileCompleteness(profile: MatchableProfile): number {
  if (!profile) return 0
  let filled = 0
  if (profile.level) filled += 1
  if (profile.targetCountries.length > 0) filled += 1
  if (profile.targetFields.length > 0) filled += 1
  return Math.round((filled / 3) * 100)
}

export function scoreOpportunity(opp: MatchableOpportunity, profile: MatchableProfile): OpportunityMatch {
  if (!profile) {
    return { score: opp.featured ? 18 : 10, reasons: ['Popular on Xcel360'] }
  }

  let score = 0
  const reasons: string[] = []
  const targetCountries = profile.targetCountries ?? []
  const targetFields = profile.targetFields ?? []

  if (profile.level && includesAny(opp.programLevel ?? [], [profile.level])) {
    score += 35
    reasons.push(`${profile.level} level`)
  }

  const country = normalize(opp.country)
  const hasGlobalCountry = ['global', 'worldwide', 'international', 'multiple countries'].includes(country)
  if (targetCountries.length > 0) {
    if (includesAny([opp.country], targetCountries)) {
      score += 30
      reasons.push(opp.country)
    } else if (hasGlobalCountry) {
      score += 18
      reasons.push('Open globally')
    }
  }

  if (targetFields.length > 0 && includesAny([opp.field, ...(opp.fieldTags ?? [])], targetFields)) {
    score += 25
    reasons.push('Your field')
  }

  if (normalize(opp.fundingType).includes('fully')) score += 5
  if (opp.featured) score += 5

  const deadline = opp.deadline ? new Date(opp.deadline).getTime() : 0
  if (deadline > Date.now()) score += 3

  return {
    score: Math.min(score, 100),
    reasons: reasons.length > 0 ? reasons.slice(0, 3) : ['Worth reviewing'],
  }
}

export function rankOpportunities<T extends MatchableOpportunity>(
  opportunities: T[],
  profile: MatchableProfile,
  limit = 10
): Array<T & OpportunityMatch> {
  return opportunities
    .map((opp) => ({ ...opp, ...scoreOpportunity(opp, profile) }))
    .sort((a, b) => b.score - a.score || Number(b.featured) - Number(a.featured))
    .slice(0, limit)
}
