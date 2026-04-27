import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
  const opportunity = await db.opportunity.create({
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

  return NextResponse.json({ id: opportunity.id, title: opportunity.title, category: opportunity.category })
}
