import { prisma } from '@/lib/prisma'
import { generateAndStoreOpImage } from '@/lib/generateOpImage'
import { parseDeadline } from '@/lib/utils'
import { revalidateOpportunityPages } from '@/lib/revalidate-opportunities'

// Shared by the in-app poster page (/post) and the external tools API
// (/api/tools/post-opportunity). Every field is sanitised here - nothing from
// the request body is passed straight to the database.

export type CreateResult =
  | { ok: true; data: { id: string; title: string; category: string; imageUrl: string | null } }
  | { ok: false; status: number; error: string }

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''

const isHttpUrl = (s: string): boolean => {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

const isEmail = (s: string): boolean =>
  /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(s)

const isValidAppLink = (s: string): boolean =>
  s === '' || isHttpUrl(s) || isEmail(s)

const ALLOWED_STATUSES = ['OPEN', 'CLOSED', 'DRAFT'] as const
const ALLOWED_CATEGORIES = ['SCHOLARSHIP', 'JOB', 'INTERNSHIP'] as const

const toStrArray = (v: unknown, itemMax: number, listMax: number): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string')
         .slice(0, listMax)
         .map(x => x.trim().slice(0, itemMax))
    : []

export async function createOpportunityFromPoster(body: Record<string, unknown>): Promise<CreateResult> {
  const title           = str(body.title,           500)
  const hostOrg         = str(body.hostOrg,         300)
  const company         = str(body.company,         300)
  const country         = str(body.country,         100)
  const fundingType     = str(body.fundingType,     100)
  const field           = str(body.field,           100)
  const eligibility     = str(body.eligibility,     2000)
  const description     = str(body.description,     8000)
  const salary          = str(body.salary,          200)
  const jobType         = str(body.jobType,         100)
  const experienceLevel = str(body.experienceLevel, 100)
  const postedBy        = str(body.postedBy,        100)

  const rawCategory = typeof body.postType === 'string' ? body.postType.toUpperCase() : ''
  const category = ALLOWED_CATEGORIES.includes(rawCategory as any)
    ? (rawCategory as typeof ALLOWED_CATEGORIES[number])
    : 'SCHOLARSHIP'

  const rawStatus = typeof body.status === 'string' ? body.status.toUpperCase() : 'OPEN'
  const status = ALLOWED_STATUSES.includes(rawStatus as any)
    ? (rawStatus as typeof ALLOWED_STATUSES[number])
    : 'OPEN'

  const applicationLink = str(body.applicationLink, 2048)
  if (applicationLink && !isValidAppLink(applicationLink)) {
    return { ok: false, status: 400, error: 'Application link must be a valid https URL or email address' }
  }

  const rawImageUrl = str(body.imageUrl, 2048)
  if (rawImageUrl && !isHttpUrl(rawImageUrl)) {
    return { ok: false, status: 400, error: 'imageUrl must be a valid https URL' }
  }
  const imageUrl = rawImageUrl || null

  const programLevel = toStrArray(body.programLevel, 100, 10)
  const requiredDocs = toStrArray(body.requiredDocs, 200, 20)
  const fieldTags    = toStrArray(body.fieldTags,    100, 20)
  const skills       = toStrArray(body.skills,       100, 30)

  if (!title || !(hostOrg || company)) {
    return { ok: false, status: 400, error: 'Title and host organisation / company are required' }
  }

  let deadline: Date | null = null
  if (body.deadline) {
    deadline = parseDeadline(body.deadline)
    if (!deadline) return { ok: false, status: 400, error: 'Deadline must be a valid date' }
  }

  const featured = body.featured === true
  const remote   = body.remote   === true

  const APP_URL   = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'
  const typeParam = category === 'JOB' ? 'job' : category === 'INTERNSHIP' ? 'internship' : 'scholarship'
  const db        = prisma as any

  let opportunity: any
  try {
    opportunity = await db.opportunity.create({
      data: {
        title,
        category,
        hostOrg:         hostOrg || company || '',
        country:         country  || 'Global',
        fundingType:     fundingType || (category === 'SCHOLARSHIP' ? 'Fully funded' : 'Other'),
        field:           field    || 'General',
        programLevel,
        deadline,
        eligibility,
        description,
        applicationLink,
        requiredDocs,
        fieldTags,
        featured,
        status,
        imageUrl,
        company:         company || null,
        jobType:         jobType || null,
        salary:          salary  || null,
        remote,
        experienceLevel: experienceLevel || null,
        skills,
        postedBy:        postedBy || null,
      },
    })

    if (!imageUrl) {
      // Branded card image stored as a static PNG in Azure Blob Storage so card
      // loads do not consume application compute.
      const staticUrl = await generateAndStoreOpImage(opportunity.id, typeParam, APP_URL)
      if (staticUrl) {
        await db.opportunity.update({ where: { id: opportunity.id }, data: { imageUrl: staticUrl } })
        opportunity.imageUrl = staticUrl
      }
    }

    await db.toolPostActivity.create({
      data: {
        poster:        postedBy || 'anonymous',
        opportunityId: opportunity.id,
        title:         opportunity.title,
        category:      opportunity.category,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[poster] DB create failed:', msg)
    return { ok: false, status: 500, error: 'Database error - check server logs' }
  }

  revalidateOpportunityPages()
  console.log('[poster] Created:', opportunity.id, opportunity.title, 'by', postedBy || 'anonymous')
  return {
    ok: true,
    data: {
      id:       opportunity.id,
      title:    opportunity.title,
      category: opportunity.category,
      imageUrl: opportunity.imageUrl,
    },
  }
}

export async function getPosterStats(poster: string) {
  const db = prisma as any
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [thisMonth, allTime, recent] = await Promise.all([
    db.toolPostActivity.count({ where: { poster, createdAt: { gte: monthStart } } }),
    db.toolPostActivity.count({ where: { poster } }),
    db.toolPostActivity.findMany({
      where: { poster },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { opportunityId: true, title: true, category: true, createdAt: true },
    }),
  ])
  return { poster, thisMonth, allTime, recent }
}

// Listings that may already be on the site: same application link, or a title
// sharing its distinctive words. Shown as a warning on /post - never blocks.
const STOP = new Set(['the', 'and', 'for', 'of', 'in', 'at', 'to', 'a', 'an', 'scholarship', 'scholarships',
  'program', 'programme', 'fully', 'funded', 'job', 'internship', 'internships', '2025', '2026', '2027', '2028'])

export async function findPossibleDuplicates(title: string, applicationLink: string) {
  const db = prisma as any
  const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w)).slice(0, 4)
  const or: any[] = []
  if (applicationLink && applicationLink.length > 10) or.push({ applicationLink })
  if (words.length >= 2) {
    or.push({ AND: words.map((w) => ({ title: { contains: w, mode: 'insensitive' } })) })
  }
  if (!or.length) return []
  try {
    const rows = await db.opportunity.findMany({
      where: { OR: or },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, hostOrg: true, createdAt: true, status: true },
    })
    return rows
  } catch {
    return []
  }
}
