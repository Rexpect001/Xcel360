import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAndStoreOpImage } from '@/lib/generateOpImage'
import { parseDeadline } from '@/lib/utils'
import { revalidateOpportunityPages } from '@/lib/revalidate-opportunities'

export const dynamic = 'force-dynamic'

// ── Validation helpers ────────────────────────────────────────────────────────

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

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.TOOLS_SECRET
  return !!(secret && auth === `Bearer ${secret}`)
}

// ── GET  -  health / stats ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = prisma as any
  try {
    const total = await db.opportunity.count()
    const recent = await db.opportunity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, category: true, status: true, createdAt: true },
    })
    return NextResponse.json({ ok: true, total, recent })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: true, message: 'Connected but DB query failed', error: msg })
  }
}

// ── POST  -  create opportunity ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Reject oversized payloads (100 KB cap)
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > 100_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ── Sanitise every field  -  no raw pass-through to DB ──
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

  // Enum-validated fields
  const rawCategory = typeof body.postType === 'string' ? body.postType.toUpperCase() : ''
  const category = ALLOWED_CATEGORIES.includes(rawCategory as any)
    ? (rawCategory as typeof ALLOWED_CATEGORIES[number])
    : 'SCHOLARSHIP'

  const rawStatus = typeof body.status === 'string' ? body.status.toUpperCase() : 'OPEN'
  const status = ALLOWED_STATUSES.includes(rawStatus as any)
    ? (rawStatus as typeof ALLOWED_STATUSES[number])
    : 'OPEN'

  // applicationLink must be an https URL or a valid email  -  nothing else
  const rawAppLink = str(body.applicationLink, 2048)
  if (rawAppLink && !isValidAppLink(rawAppLink)) {
    return NextResponse.json(
      { error: 'applicationLink must be a valid https URL or email address' },
      { status: 400 }
    )
  }
  const applicationLink = rawAppLink

  // imageUrl, if provided, must be an https URL
  const rawImageUrl = str(body.imageUrl, 2048)
  if (rawImageUrl && !isHttpUrl(rawImageUrl)) {
    return NextResponse.json(
      { error: 'imageUrl must be a valid https URL' },
      { status: 400 }
    )
  }
  const imageUrl = rawImageUrl || null

  // Arrays  -  only accept string elements, cap each item and array length
  const toStrArray = (v: unknown, itemMax: number, listMax: number): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string')
           .slice(0, listMax)
           .map(x => x.trim().slice(0, itemMax))
      : []

  const programLevel  = toStrArray(body.programLevel,  100, 10)
  const requiredDocs  = toStrArray(body.requiredDocs,   200, 20)
  const fieldTags     = toStrArray(body.fieldTags,      100, 20)
  const skills        = toStrArray(body.skills,         100, 30)

  // Scalar validation
  if (!title || !hostOrg) {
    return NextResponse.json({ error: 'title and hostOrg are required' }, { status: 400 })
  }

  // Deadline must be a valid future-ish date string if provided
  let deadline: Date | null = null
  if (body.deadline) {
    deadline = parseDeadline(body.deadline)
    if (!deadline) {
      return NextResponse.json({ error: 'deadline must be a valid date string' }, { status: 400 })
    }
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
      // Generate the branded card image and store it as a permanent static PNG in
      // Vercel Blob so card loads are served from CDN with zero compute.
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
    console.error('[post-opportunity] DB create failed:', msg)
    return NextResponse.json({ error: 'DB error  -  check server logs' }, { status: 500 })
  }

  revalidateOpportunityPages()
  console.log('[post-opportunity] Created:', opportunity.id, opportunity.title)
  return NextResponse.json({
    id:       opportunity.id,
    title:    opportunity.title,
    category: opportunity.category,
    imageUrl: opportunity.imageUrl,
  })
}
