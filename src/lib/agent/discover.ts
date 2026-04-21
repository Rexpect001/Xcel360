/**
 * Auto-Discovery Agent
 * Runs every 8 hours via /api/cron/auto-discover
 * Searches the web for new scholarship/internship opportunities,
 * extracts structured data with Claude Haiku, validates, and saves to DB.
 */

import prisma from '@/lib/prisma'

// ─── Search queries ───────────────────────────────────────────────────────────

const SEARCH_QUERIES: { query: string; category: 'SCHOLARSHIP' | 'INTERNSHIP' }[] = [
  { query: 'scholarship 2025 applications open deadline international students', category: 'SCHOLARSHIP' },
  { query: 'fully funded scholarship fellowship 2025 apply now', category: 'SCHOLARSHIP' },
  { query: 'scholarship grant program 2025 open call deadline', category: 'SCHOLARSHIP' },
  { query: 'internship program 2025 applications open paid apply', category: 'INTERNSHIP' },
  { query: 'internship fellowship 2025 open deadline apply now', category: 'INTERNSHIP' },
]

// Keywords that suggest the result is a genuine opportunity listing
const RELEVANCE_KEYWORDS = [
  'deadline', 'apply', 'application', 'scholarship', 'fellowship', 'internship',
  'funded', 'stipend', 'eligible', 'eligibility', 'open', '2025', '2026',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface SerperResult {
  title: string
  link: string
  snippet: string
}

interface ExtractedOpp {
  isOpportunity: boolean
  title: string
  hostOrg: string
  country: string
  fundingType: string
  field: string
  programLevel: string[]
  deadline: string | null
  eligibility: string
  description: string
  applicationLink: string
  requiredDocs: string[]
  fieldTags: string[]
  category: 'SCHOLARSHIP' | 'INTERNSHIP' | 'JOB'
  jobType?: string
  company?: string
  salary?: string
  remote?: boolean
  skills?: string[]
  experienceLevel?: string
}

export interface DiscoveryReport {
  searched: number
  candidates: number
  fetched: number
  extracted: number
  saved: number
  skipped: number
  errors: number
  posted: { title: string; category: string; deadline: string; country: string }[]
  missingKeys: string[]
}

// ─── Phase 1: Search ──────────────────────────────────────────────────────────

async function searchOpportunities(
  query: string
): Promise<SerperResult[]> {
  const key = process.env.SERPER_API_KEY
  if (!key) return []

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': key,
        'Content-Type': 'application/json',
      },
      // tbs: qdr:w = results from the last week
      body: JSON.stringify({ q: query, num: 8, tbs: 'qdr:w' }),
    })

    if (!res.ok) return []
    const data = await res.json()
    return (data.organic ?? []).map((r: any) => ({
      title: r.title ?? '',
      link: r.link ?? '',
      snippet: r.snippet ?? '',
    }))
  } catch {
    return []
  }
}

// ─── Phase 2: Heuristic filter ────────────────────────────────────────────────

function isLikelyOpportunity(result: SerperResult): boolean {
  const text = `${result.title} ${result.snippet}`.toLowerCase()
  const matches = RELEVANCE_KEYWORDS.filter((kw) => text.includes(kw))
  // Require at least 3 keyword hits and a valid-looking URL
  return matches.length >= 3 && result.link.startsWith('http')
}

// ─── Phase 3: Scrape ──────────────────────────────────────────────────────────

async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'text/html',
      },
    })
    clearTimeout(timer)

    if (!res.ok) return ''
    const html = await res.text()

    // Strip scripts, styles, and tags; collapse whitespace; limit to 5000 chars
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)
  } catch {
    return ''
  }
}

// ─── Phase 4: Extract with Gemini Flash ──────────────────────────────────────

const EXTRACT_SYSTEM_PROMPT = `You extract scholarship, fellowship, internship, and job opportunity details from webpage text.
Return ONLY a valid JSON object with exactly these fields — no markdown, no explanation:
{
  "isOpportunity": true or false,
  "title": "full opportunity name",
  "hostOrg": "hosting organization or university",
  "country": "country name, or 'Global' for international/multi-country",
  "fundingType": "one of: Fully funded, Partial, Stipend, Tuition waiver, Paid, Unpaid, Other",
  "field": "one of: STEM, Non-STEM",
  "programLevel": ["subset of: Undergrad, Masters, PhD, Postdoc — or ['Any'] if all levels"],
  "deadline": "YYYY-MM-DD string, or null if not found",
  "eligibility": "who can apply — nationalities, degree, GPA requirements, etc.",
  "description": "2-3 sentence overview of what this opportunity offers",
  "applicationLink": "direct application URL if found, else empty string",
  "requiredDocs": ["list of required documents, e.g. CV, SOP, Transcripts"],
  "fieldTags": ["2-5 relevant subject tags, e.g. Engineering, Medicine, Law"],
  "category": "one of: SCHOLARSHIP, INTERNSHIP, JOB",
  "jobType": "Full-time, Part-time, Contract, Remote — only for JOB/INTERNSHIP, else null",
  "company": "company name — only for JOB/INTERNSHIP, else null",
  "salary": "salary range or stipend amount if stated, else null",
  "remote": true or false,
  "skills": ["required skills — only for JOB/INTERNSHIP, else []"],
  "experienceLevel": "Entry Level, Mid Level, Senior Level, Internship — only for JOB/INTERNSHIP, else null"
}
Set isOpportunity=false if this is not an opportunity listing (e.g. news article, blog post, aggregator page without specifics).`

async function extractOpportunity(
  content: string,
  fallbackUrl: string
): Promise<ExtractedOpp | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || !content.trim()) return null

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: EXTRACT_SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [{ text: `Extract opportunity details from this webpage content:\n\n${content.slice(0, 4500)}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!text) return null

    const extracted: ExtractedOpp = JSON.parse(text)
    if (!extracted.isOpportunity) return null

    // Fall back to the source URL if no application link was found
    if (!extracted.applicationLink?.startsWith('http')) {
      extracted.applicationLink = fallbackUrl
    }

    return extracted
  } catch {
    return null
  }
}

// ─── Phase 5: Validate ────────────────────────────────────────────────────────

function validateOpportunity(opp: ExtractedOpp): boolean {
  if (!opp.title?.trim() || opp.title.trim().length < 5) return false
  if (!opp.hostOrg?.trim()) return false
  if (!opp.applicationLink?.startsWith('http')) return false
  if (!opp.country?.trim()) return false
  if (!opp.eligibility?.trim() || opp.eligibility.trim().length < 5) return false

  // Deadline must be present and in the future
  if (!opp.deadline) return false
  const deadline = new Date(opp.deadline)
  if (isNaN(deadline.getTime())) return false
  if (deadline <= new Date()) return false

  return true
}

// ─── Phase 6: Normalize ───────────────────────────────────────────────────────

function normalizeOpp(
  opp: ExtractedOpp,
  overrideCategory?: 'SCHOLARSHIP' | 'INTERNSHIP'
) {
  const fundingMap: Record<string, string> = {
    Other: 'Partial',
    'Stipend only': 'Stipend',
    'Tuition only': 'Tuition waiver',
  }

  const levelMap: Record<string, string> = {
    Undergraduate: 'Undergrad',
    Postdoctoral: 'Postdoc',
    Professional: 'Postdoc',
  }

  const validLevels = new Set(['Undergrad', 'Masters', 'PhD', 'Postdoc', 'Any'])
  const validFunding = new Set(['Fully funded', 'Partial', 'Stipend', 'Tuition waiver', 'Paid', 'Unpaid'])
  const validField = new Set(['STEM', 'Non-STEM'])

  const programLevel = (opp.programLevel ?? [])
    .map((l) => levelMap[l] ?? l)
    .filter((l) => validLevels.has(l))

  const fundingType = fundingMap[opp.fundingType] ?? opp.fundingType
  const field = validField.has(opp.field) ? opp.field : 'Non-STEM'
  const category = overrideCategory ?? opp.category ?? 'SCHOLARSHIP'

  return {
    title: opp.title.trim(),
    category,
    programLevel: programLevel.length ? programLevel : ['Any'],
    field,
    fieldTags: Array.from(new Set([...(opp.fieldTags ?? []), 'Auto-discovered'])),
    country: opp.country.trim(),
    hostOrg: opp.hostOrg.trim(),
    fundingType: validFunding.has(fundingType) ? fundingType : 'Partial',
    deadline: new Date(opp.deadline!),
    eligibility: opp.eligibility.trim(),
    requiredDocs: opp.requiredDocs ?? [],
    applicationLink: opp.applicationLink,
    description: opp.description?.trim() ?? null,
    status: 'OPEN' as const,
    featured: false,
    // Job/internship fields
    jobType: opp.jobType ?? null,
    company: opp.company ?? null,
    salary: opp.salary ?? null,
    remote: opp.remote ?? false,
    skills: opp.skills ?? [],
    experienceLevel: opp.experienceLevel ?? null,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runDiscovery(): Promise<DiscoveryReport> {
  const report: DiscoveryReport = {
    searched: 0,
    candidates: 0,
    fetched: 0,
    extracted: 0,
    saved: 0,
    skipped: 0,
    errors: 0,
    posted: [],
    missingKeys: [],
  }

  if (!process.env.SERPER_API_KEY) report.missingKeys.push('SERPER_API_KEY')
  if (!process.env.GEMINI_API_KEY) report.missingKeys.push('GEMINI_API_KEY')
  if (report.missingKeys.length) return report

  // ── Phase 1: Search ──
  const rawResults: (SerperResult & { category: 'SCHOLARSHIP' | 'INTERNSHIP' })[] = []

  for (const { query, category } of SEARCH_QUERIES) {
    const results = await searchOpportunities(query)
    for (const r of results) rawResults.push({ ...r, category })
    report.searched += results.length
  }

  // ── Deduplicate URLs ──
  const seenUrls = new Set<string>()
  const unique = rawResults.filter((r) => {
    if (!r.link || seenUrls.has(r.link)) return false
    seenUrls.add(r.link)
    return true
  })

  // ── Phase 2: Heuristic filter ──
  const candidates = unique.filter(isLikelyOpportunity)
  report.candidates = candidates.length

  // Cap at 15 page fetches per run to control costs
  const toProcess = candidates.slice(0, 15)

  for (const result of toProcess) {
    try {
      // ── Phase 3: Scrape ──
      const pageContent = await fetchPageContent(result.link)
      report.fetched++

      // Fall back to title + snippet if page fetch returned nothing
      const content = pageContent.trim()
        ? pageContent
        : `${result.title}\n\n${result.snippet}`

      // ── Phase 4: Extract ──
      const extracted = await extractOpportunity(content, result.link)
      if (!extracted) {
        report.skipped++
        continue
      }
      extracted.category = result.category // trust search query category
      report.extracted++

      // ── Phase 5: Validate ──
      if (!validateOpportunity(extracted)) {
        report.skipped++
        continue
      }

      // ── Phase 6: Normalize ──
      const normalized = normalizeOpp(extracted, result.category)

      // ── Phase 7: Dedup check ──
      const db = prisma as any
      const exists = await db.opportunity.findFirst({
        where: {
          title: { equals: normalized.title, mode: 'insensitive' },
          deadline: normalized.deadline,
        },
        select: { id: true },
      })

      if (exists) {
        report.skipped++
        continue
      }

      // ── Phase 8: Save ──
      await db.opportunity.create({ data: normalized })
      report.saved++
      report.posted.push({
        title: normalized.title,
        category: normalized.category,
        deadline: normalized.deadline.toISOString().split('T')[0],
        country: normalized.country,
      })
    } catch (err) {
      console.error('[DISCOVER ERROR]', result.link, err)
      report.errors++
    }
  }

  return report
}
