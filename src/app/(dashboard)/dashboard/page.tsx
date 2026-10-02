export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, Bookmark, SquareKanban, Bell, CalendarClock, PenLine, ScrollText, Mail, Send, Search, UserCircle } from 'lucide-react'
import { profileCompleteness, rankOpportunities } from '@/lib/matching'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'
import { deadlineInfo } from '@/lib/opportunity-display'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import { cn } from '@/lib/utils'

async function getDashboardData(userId: string) {
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 864e5)
  const [profile, savedCount, applicationCount, unreadNotifications, openOpportunities, upcoming] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.savedOpportunity.count({ where: { userId } }),
    prisma.application.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.opportunity.findMany({
      where: liveOpportunityWhere({ category: 'SCHOLARSHIP' }),
      orderBy: [{ featured: 'desc' }, { deadline: { sort: 'asc', nulls: 'last' } }],
      take: 60,
    }),
    prisma.savedOpportunity.findMany({
      where: { userId, opportunity: { deadline: { gte: now, lte: in30 } } },
      orderBy: { opportunity: { deadline: 'asc' } },
      take: 6,
      select: { opportunity: { select: { id: true, title: true, hostOrg: true, deadline: true, category: true } } },
    }),
  ])
  return { profile, savedCount, applicationCount, unreadNotifications, openOpportunities, upcoming }
}

const TOOLS = [
  { href: '/dashboard/tools/cv', label: 'CV Builder', icon: PenLine },
  { href: '/dashboard/tools/sop', label: 'SOP Generator', icon: ScrollText },
  { href: '/dashboard/tools/cover-letter', label: 'Cover Letter', icon: Mail },
  { href: '/dashboard/tools/cold-email', label: 'Cold Email', icon: Send },
]

export default async function DashboardPage() {
  const session = await getAuth()
  if (!session) redirect('/signin')

  const { profile, savedCount, applicationCount, unreadNotifications, openOpportunities, upcoming } =
    await getDashboardData(session.user.id)

  const completion = profileCompleteness(profile)
  const ranked = rankOpportunities(openOpportunities, profile, 60)
  const matchedCount = ranked.filter((o) => o.score >= 50).length
  const display = ranked.slice(0, 6)
  const firstName = session.user.name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = [
    { label: 'Saved', value: savedCount, href: '/dashboard/saved', Icon: Bookmark },
    { label: 'In your tracker', value: applicationCount, href: '/dashboard/applications', Icon: SquareKanban },
    { label: 'Closing in 30 days', value: upcoming.length, href: '/dashboard/deadlines', Icon: CalendarClock },
    { label: 'Unread alerts', value: unreadNotifications, href: '/dashboard/notifications', Icon: Bell },
  ]

  return (
    <div>
      {/* Header */}
      <header className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">{greeting}</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-900">Welcome back, {firstName}</h1>
          <p className="text-ink-500 mt-2">
            {matchedCount > 0
              ? `${matchedCount} open scholarships match your profile right now.`
              : 'Complete your profile and we will surface the scholarships that fit you best.'}
          </p>
        </div>
        <form action="/opportunities" className="flex items-center gap-2 w-full lg:w-[380px] bg-white border border-surface-200 rounded-xl pl-3.5 pr-1.5 py-1.5 shadow-soft">
          <Search className="h-4 w-4 text-ink-300 shrink-0" />
          <label htmlFor="dash-search" className="sr-only">Search scholarships</label>
          <input id="dash-search" name="search" placeholder="Search scholarships…" className="flex-1 min-w-0 py-1.5 text-sm bg-transparent focus:outline-none" />
          <button type="submit" className="rounded-lg bg-brand-600 text-white text-xs font-semibold px-3 py-2 hover:bg-brand-700">Search</button>
        </form>
      </header>

      {/* Profile completeness */}
      {completion < 100 && (
        <div className="mb-8 paper-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-11 h-11 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center shrink-0">
            <UserCircle className="h-6 w-6" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-ink-900">Your profile is {completion}% complete</p>
              <span className="text-xs font-bold text-ink-500">{completion}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-100 overflow-hidden">
              <div className="h-full rounded-full bg-accent-400" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-xs text-ink-500 mt-2">Add your level, field and target countries for sharper matches.</p>
          </div>
          <Link href="/dashboard/profile" className="btn-primary !py-2.5 shrink-0">Finish profile</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-10">
        {stats.map(({ label, value, href, Icon }) => (
          <Link key={label} href={href} className="group paper-card p-4 sm:p-5 hover:border-ink-200 transition-colors">
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-ink-300 group-hover:text-accent-600 transition-colors" />
              <ArrowRight className="h-4 w-4 text-ink-200 group-hover:text-ink-700 transition-colors" />
            </div>
            <div className="mt-4 font-display text-3xl font-semibold text-ink-900">{value}</div>
            <div className="text-xs font-semibold text-ink-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        {/* Matches */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl text-ink-900">{matchedCount > 0 ? 'Matched for you' : 'Open scholarships'}</h2>
              <p className="text-sm text-ink-500 mt-1">Ranked by your profile, then by deadline.</p>
            </div>
            <Link href="/opportunities" className="text-sm font-semibold text-ink-700 hover:text-ink-900 inline-flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {display.length === 0 ? (
            <div className="paper-card p-10 text-center text-ink-500">New opportunities are added daily. Check back soon.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {display.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} match={opp.score} />
              ))}
            </div>
          )}
        </section>

        {/* Side column */}
        <aside className="space-y-6">
          <section className="paper-card">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h2 className="font-bold text-ink-900">Coming up</h2>
              <Link href="/dashboard/deadlines" className="text-xs font-semibold text-ink-500 hover:text-ink-900">All deadlines</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-ink-500">
                Nothing you saved closes in the next 30 days. Save scholarships to see their deadlines here.
              </p>
            ) : (
              <ul className="divide-y divide-surface-100">
                {upcoming.map(({ opportunity: o }) => {
                  const dl = deadlineInfo(o.deadline)
                  return (
                    <li key={o.id}>
                      <Link href={`/opportunities/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50">
                        <span className="w-11 shrink-0 text-center rounded-lg border border-surface-200 py-1">
                          <span className="block text-[10px] font-bold uppercase text-ink-400">{dl.date.split(' ')[1]}</span>
                          <span className="block font-display text-lg leading-none text-ink-900">{dl.date.split(' ')[0]}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink-900 truncate">{o.title}</span>
                          <span className={cn('block text-xs font-semibold', dl.tone)}>{dl.label}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-brand-600 text-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Writing tools</h2>
              <span className="pro-badge">PRO</span>
            </div>
            <p className="text-xs text-brand-100 mt-1">Draft your documents in minutes, in your own words.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {TOOLS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="rounded-xl bg-white/[0.06] border border-white/10 p-3 hover:bg-white/10 transition-colors">
                  <Icon className="h-4 w-4 text-accent-200" />
                  <span className="block text-xs font-semibold mt-2">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <Link href="/dashboard/services/advisor" className="block paper-card p-5 hover:border-ink-200 transition-colors">
            <p className="font-bold text-ink-900">Stuck on an application?</p>
            <p className="text-sm text-ink-500 mt-1">Speak with an Xcel360 advisor.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Book a session <ArrowRight className="h-4 w-4" /></span>
          </Link>
        </aside>
      </div>
    </div>
  )
}
