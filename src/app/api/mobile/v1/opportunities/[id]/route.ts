export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { getMobileUser } from '@/lib/mobile/auth'
import { fail, ok, preflight } from '@/lib/mobile/http'
import { monogram } from '@/lib/opportunity-display'
import { topicsForListing } from '@/lib/scholarship-topics'
import { SITE_URL } from '@/lib/seo/structured-data'

export const OPTIONS = preflight

const WEB_PATH = { SCHOLARSHIP: 'opportunities', JOB: 'jobs', INTERNSHIP: 'internships' } as const

/** GET one listing in full. Public; with a token it also says whether the student saved it. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!/^[a-z0-9]{10,40}$/i.test(params.id)) return fail('Not found.', 404)
  const o = await prisma.opportunity.findUnique({
    where: { id: params.id },
    select: {
      id: true, title: true, hostOrg: true, company: true, category: true, country: true, region: true,
      programLevel: true, field: true, fieldTags: true, fundingType: true, deadline: true, eligibility: true,
      description: true, requiredDocs: true, applicationLink: true, status: true, featured: true, imageUrl: true,
      jobType: true, salary: true, remote: true, experienceLevel: true, skills: true, createdAt: true,
    },
  })
  if (!o) return fail('This opportunity is no longer listed.', 404)

  const user = await getMobileUser(req)
  const saved = user
    ? !!(await prisma.savedOpportunity.findUnique({ where: { userId_opportunityId: { userId: user.id, opportunityId: o.id } }, select: { id: true } }))
    : false

  const org = o.company || o.hostOrg
  const closed = o.status !== 'OPEN' || (o.deadline !== null && o.deadline.getTime() < new Date().setHours(0, 0, 0, 0))
  return ok({
    ...o,
    org,
    monogram: monogram(org),
    deadline: o.deadline?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
    imageUrl: o.imageUrl?.includes('/api/og') ? null : o.imageUrl,
    closed,
    saved,
    webUrl: `${SITE_URL}/${WEB_PATH[o.category]}/${o.id}`,
    topics: o.category === 'SCHOLARSHIP' ? topicsForListing(o).slice(0, 4).map((t) => ({ slug: t.slug, label: t.h1 })) : [],
  })
}
