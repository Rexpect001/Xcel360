import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Verify shared secret from the tools app
  const auth = req.headers.get('authorization')
  const secret = process.env.TOOLS_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    title, hostOrg, country, fundingType, field, programLevel,
    deadline, eligibility, description, applicationLink,
    requiredDocs, fieldTags, featured, status,
  } = body

  if (!title || !hostOrg) {
    return NextResponse.json({ error: 'title and hostOrg are required' }, { status: 400 })
  }

  const db = prisma as any
  const opportunity = await db.opportunity.create({
    data: {
      title,
      hostOrg:         hostOrg ?? '',
      country:         country ?? 'Global',
      fundingType:     fundingType ?? 'Fully funded',
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
    },
  })

  return NextResponse.json({ id: opportunity.id, title: opportunity.title })
}
