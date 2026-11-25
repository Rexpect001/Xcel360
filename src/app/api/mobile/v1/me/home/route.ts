export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { ok, preflight, withUser } from '@/lib/mobile/http'
import { profileCompleteness, rankOpportunities } from '@/lib/matching'
import { liveListings, toCard } from '@/lib/mobile/listings'
import { SCHOLARSHIP_TOPICS } from '@/lib/scholarship-topics'
import { isIndexable, topicCounts } from '@/lib/scholarship-topics-data'

export const OPTIONS = preflight

const POPULAR = ['fully-funded-masters-scholarships', 'scholarships-in-europe', 'fully-funded-phd-scholarships', 'scholarships-in-uk', 'scholarships-in-usa', 'undergraduate-scholarships']

/**
 * GET everything the Home tab shows, in one request (one round trip matters on
 * slow mobile data): matches ranked for the profile, saved deadlines in the next
 * 30 days, the newest unread notice, and popular topics.
 */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const in30 = new Date(Date.now() + 30 * 864e5)
    const [profile, listings, closing, latestNotice, unread, counts] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: user.id } }),
      liveListings('SCHOLARSHIP'),
      prisma.savedOpportunity.findMany({
        where: { userId: user.id, opportunity: { status: 'OPEN', deadline: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: in30 } } },
        orderBy: { opportunity: { deadline: 'asc' } },
        take: 5,
        select: { opportunity: { select: { id: true, title: true, hostOrg: true, company: true, deadline: true } } },
      }),
      prisma.notification.findFirst({
        where: { userId: user.id, read: false },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, message: true, link: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
      topicCounts(),
    ])

    const ranked = rankOpportunities(listings, profile, 60)
    const matches = ranked.slice(0, 12).map((o) => ({ ...toCard(o), score: o.score, reasons: o.reasons }))

    return ok({
      firstName: user.name?.split(' ')[0] ?? null,
      profileCompleteness: profileCompleteness(profile),
      matchCount: ranked.filter((o) => o.score >= 50).length,
      matches,
      closingSoon: closing.map(({ opportunity: o }) => ({ id: o.id, title: o.title, org: o.company || o.hostOrg, deadline: o.deadline?.toISOString() ?? null })),
      latestNotice: latestNotice ? { ...latestNotice, createdAt: latestNotice.createdAt.toISOString() } : null,
      unreadNotifications: unread,
      topics: POPULAR.map((slug) => SCHOLARSHIP_TOPICS.find((t) => t.slug === slug))
        .filter((t): t is NonNullable<typeof t> => !!t && isIndexable(counts.get(t.slug) ?? 0))
        .map((t) => ({ slug: t.slug, label: t.label, count: counts.get(t.slug) ?? 0 })),
    })
  })
}
