import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages. /programs is excluded - it redirects to /events, and a
  // sitemap should never list a redirect target as if it were real content.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/opportunities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/jobs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/internships`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/resources`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/news`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/success-stories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/how-to-search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Dynamic opportunity pages, split by category to match the canonical URL
  // each card actually links to in the app (scholarships -> /opportunities/id,
  // jobs -> /jobs/id, internships -> /internships/id) so the sitemap never
  // submits the same record under two different paths.
  const opportunities = await prisma.opportunity
    .findMany({
      where: liveOpportunityWhere(),
      select: { id: true, updatedAt: true, category: true },
      orderBy: { updatedAt: 'desc' },
    })
    .catch(() => [])

  const basePathForCategory = (category: string) =>
    category === 'JOB' ? 'jobs' : category === 'INTERNSHIP' ? 'internships' : 'opportunities'

  const oppPages: MetadataRoute.Sitemap = opportunities.map((o) => ({
    url: `${BASE}/${basePathForCategory(o.category)}/${o.id}`,
    lastModified: o.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  // Dynamic event pages
  const events = await prisma.event
    .findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
      orderBy: { date: 'asc' },
    })
    .catch(() => [])

  const eventPages: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE}/events/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.75,
  }))

  // Guides/templates live at /resources/{slug}. The same BlogPost records are
  // also rendered at /news/{slug} - until that's deduped at the content level,
  // only /resources is submitted here to avoid telling Google the same post
  // has two different canonical homes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = await (prisma as any).blogPost
    .findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    .catch(() => [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resourcePages: MetadataRoute.Sitemap = posts.map((p: any) => ({
    url: `${BASE}/resources/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...oppPages, ...eventPages, ...resourcePages]
}
