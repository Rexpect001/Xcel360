import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.TOOLS_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized — TOOLS_SECRET mismatch' }, { status: 401 })
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

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.TOOLS_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    postType,
    title, hostOrg, country, fundingType, field, programLevel,
    deadline, eligibility, description, applicationLink,
    requiredDocs, fieldTags, featured, status,
    // Job / Internship fields
    company, jobType, salary, remote, experienceLevel, skills,
  } = body

  if (!title || !hostOrg) {
    return NextResponse.json({ error: 'title and hostOrg are required' }, { status: 400 })
  }

  const category = postType === 'JOB' ? 'JOB' : postType === 'INTERNSHIP' ? 'INTERNSHIP' : 'SCHOLARSHIP'

  const db = prisma as any

  let opportunity: any
  try {
    opportunity = await db.opportunity.create({
      data: {
        title,
        category,
        hostOrg:         hostOrg ?? company ?? '',
        country:         country ?? 'Global',
        fundingType:     fundingType ?? (category === 'SCHOLARSHIP' ? 'Fully funded' : 'Other'),
        field:           field ?? 'General',
        programLevel:    Array.isArray(programLevel) ? programLevel : [],
        deadline:        deadline ? new Date(deadline) : null,
        eligibility:     eligibility ?? '',
        description:     description ?? '',
        applicationLink: applicationLink ?? '',
        requiredDocs:    Array.isArray(requiredDocs) ? requiredDocs : [],
        fieldTags:       Array.isArray(fieldTags) ? fieldTags : [],
        featured:        featured === true,
        status:          status ?? 'OPEN',
        // Job / Internship extras
        company:         company ?? null,
        jobType:         jobType ?? null,
        salary:          salary ?? null,
        remote:          remote === true,
        experienceLevel: experienceLevel ?? null,
        skills:          Array.isArray(skills) ? skills : [],
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[post-opportunity] DB create failed:', msg)
    return NextResponse.json({ error: `DB error: ${msg}` }, { status: 500 })
  }

  console.log('[post-opportunity] Created:', opportunity.id, opportunity.title)
  return NextResponse.json({ id: opportunity.id, title: opportunity.title, category: opportunity.category })
}
