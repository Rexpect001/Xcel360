import type { Opportunity, Profile } from '@prisma/client'

export type MatchableProfile = Pick<
  Profile,
  'level' | 'targetCountries' | 'targetFields' | 'courseOfStudy' | 'department' | 'degree' | 'graduationYear'
> | null | undefined

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
  | 'eligibility'
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

// ─── Token-based fuzzy matching ──────────────────────────────────────────────
// Splits free text ("Mechanical Engineering", opp title, tags) into comparable
// tokens so real course names match broader opportunity fields without an
// external ML service. Stopwords are stripped so "MSc in Engineering" still
// matches "Engineering".

const STOPWORDS = new Set([
  'of', 'in', 'and', 'the', 'for', 'a', 'an', 'to', 'with', 'on', 'at',
  'msc', 'bsc', 'ma', 'ba', 'phd', 'degree', 'program', 'programme',
  'studies', 'study', 'science', 'sciences',
])

function tokenize(value: string | null | undefined): Set<string> {
  return new Set(
    normalize(value)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  )
}

function tokensOverlap(a: Set<string>, b: Set<string>): boolean {
  let found = false
  a.forEach((t) => {
    if (b.has(t)) found = true
  })
  return found
}

// Degree → likely study level, used as a soft signal when level is not set
const DEGREE_LEVEL_HINTS: Record<string, string> = {
  'b.sc': 'Undergrad', 'b.a': 'Undergrad', 'b.eng': 'Undergrad', 'b.tech': 'Undergrad',
  'b.ed': 'Undergrad', 'll.b': 'Undergrad', 'mbbs': 'Undergrad',
  'hnd': 'Undergrad', 'ond': 'Undergrad',
  'm.sc': 'Masters', 'm.a': 'Masters', 'm.eng': 'Masters', 'mba': 'Masters', 'm.ed': 'Masters',
  'phd': 'PhD',
}

export function profileCompleteness(profile: MatchableProfile): number {
  if (!profile) return 0
  let filled = 0
  if (profile.level) filled += 1
  if (profile.targetCountries.length > 0) filled += 1
  if (profile.targetFields.length > 0) filled += 1
  if (profile.courseOfStudy) filled += 1
  if (profile.degree) filled += 1
  return Math.round((filled / 5) * 100)
}

export function scoreOpportunity(opp: MatchableOpportunity, profile: MatchableProfile): OpportunityMatch {
  if (!profile) {
    return { score: opp.featured ? 18 : 10, reasons: ['Popular on Xcel360'] }
  }

  let score = 0
  const reasons: string[] = []
  const targetCountries = profile.targetCountries ?? []
  const targetFields = profile.targetFields ?? []

  // 1. Study level (with a soft fallback to the degree they graduated with)
  const effectiveLevel = profile.level ?? (profile.degree ? DEGREE_LEVEL_HINTS[normalize(profile.degree)] : undefined)
  if (effectiveLevel && includesAny(opp.programLevel ?? [], [effectiveLevel])) {
    score += 30
    reasons.push(`${effectiveLevel} level`)
  }

  // 2. Destination country
  const country = normalize(opp.country)
  const hasGlobalCountry = ['global', 'worldwide', 'international', 'multiple countries'].includes(country)
  if (targetCountries.length > 0) {
    if (includesAny([opp.country], targetCountries)) {
      score += 25
      reasons.push(opp.country)
    } else if (hasGlobalCountry) {
      score += 15
      reasons.push('Open globally')
    }
  }

  // 3. Field-of-interest match (explicit tags chosen by the user)
  const fieldMatched = targetFields.length > 0 && includesAny([opp.field, ...(opp.fieldTags ?? [])], targetFields)
  if (fieldMatched) {
    score += 20
    reasons.push('Your field')
  }

  // 4. Course-of-study match — the "ML-style" signal: token overlap between the
  //    user's course/department and the opportunity's title, field, and tags.
  const courseTokens = new Set(Array.from(tokenize(profile.courseOfStudy)).concat(Array.from(tokenize(profile.department))))
  if (courseTokens.size > 0) {
    const oppTokens = new Set(
      Array.from(tokenize(opp.title))
        .concat(Array.from(tokenize(opp.field)))
        .concat((opp.fieldTags ?? []).flatMap((t) => Array.from(tokenize(t))))
        .concat(Array.from(tokenize((opp as { eligibility?: string | null }).eligibility?.slice(0, 400))))
    )
    if (tokensOverlap(courseTokens, oppTokens)) {
      score += fieldMatched ? 8 : 15 // stronger when it's the only field signal
      if (!fieldMatched) reasons.push('Matches your course')
    }
  }

  // 5. Bonuses
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
