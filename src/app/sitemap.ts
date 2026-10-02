import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/opportunities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/mentorship`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/programs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/resources`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/success-stories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Dynamic opportunity pages
  const opportunities = await prisma.opportunity
    .findMany({
      where: liveOpportunityWhere(),
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    .catch(() => [])

  const oppPages: MetadataRoute.Sitemap = opportunities.map((o) => ({
    url: `${BASE}/opportunities/${o.id}`,
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

  return [...staticPages, ...oppPages, ...eventPages]
}
