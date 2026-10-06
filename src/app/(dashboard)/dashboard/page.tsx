export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowRight, Bookmark, SquareKanban, Bell, CalendarClock, PenLine, ScrollText, Mail, Send, Search,
  UserCircle, Sparkles, Headset, Check,
} from 'lucide-react'
import { profileCompleteness, rankOpportunities } from '@/lib/matching'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'
import { deadlineInfo } from '@/lib/opportunity-display'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import DashboardWelcome from '@/components/dashboard/DashboardWelcome'
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
  { href: '/dashboard/tools/cv', label: 'CV Builder', icon: PenLine, hint: 'A scholarship-ready CV from your profile' },
  { href: '/dashboard/tools/sop', label: 'SOP Generator', icon: ScrollText, hint: 'Statement of purpose, drafted with you' },
  { href: '/dashboard/tools/cover-letter', label: 'Cover Letter', icon: Mail, hint: 'Tailored to each opportunity' },
  { href: '/dashboard/tools/cold-email', label: 'Cold Email', icon: Send, hint: 'Reach supervisors and professors' },
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
  const nextDeadline = upcoming[0] ? deadlineInfo(upcoming[0].opportunity.deadline) : null

  const stats = [
    { label: 'Saved', value: savedCount, href: '/dashboard/saved', Icon: Bookmark, chip: 'bg-brand-50 text-brand-600 ring-brand-100' },
    { label: 'In your tracker', value: applicationCount, href: '/dashboard/applications', Icon: SquareKanban, chip: 'bg-violet-50 text-violet-600 ring-violet-100' },
    { label: 'Closing in 30 days', value: upcoming.length, href: '/dashboard/deadlines', Icon: CalendarClock, chip: 'bg-amber-50 text-amber-600 ring-amber-100' },
    { label: 'Unread alerts', value: unreadNotifications, href: '/dashboard/notifications', Icon: Bell, chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  ]

  return (
    <div>
      <DashboardWelcome firstName={firstName} />

      {/* Header */}
      <header className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">{greeting}</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-900">Welcome back, {firstName}</h1>
        </div>
        <form action="/opportunities" className="flex items-center gap-2 w-full lg:w-[380px] bg-white ring-1 ring-surface-200 rounded-full pl-4 pr-1.5 py-1.5 shadow-soft">
          <Search className="h-4 w-4 text-ink-300 shrink-0" />
          <label htmlFor="dash-search" className="sr-only">Search scholarships</label>
          <input id="dash-search" name="search" placeholder="Search scholarships…" className="flex-1 min-w-0 py-1.5 text-sm bg-transparent focus:outline-none" />
          <button type="submit" className="rounded-full bg-brand-600 text-white text-xs font-semibold px-4 py-2 hover:bg-brand-700">Search</button>
        </form>
      </header>

      {/* Hero banner - profile and match summary at a glance */}
      <section className="relative overflow-hidden mb-6 rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 text-white p-5 sm:p-7 shadow-accent">
        <div aria-hidden className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent-400/25 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <ProgressRing value={completion} />
            <div className="min-w-0">
              <h2 className="font-display text-2xl sm:text-[1.75rem] text-white">
                {matchedCount > 0
                  ? `${matchedCount} scholarship${matchedCount === 1 ? '' : 's'} match your profile`
                  : 'Let us find your best-fit scholarships'}
              </h2>
              <p className="text-sm text-brand-100 mt-1">
                {completion < 100
                  ? `Your profile is ${completion}% complete. Add your level, field and target countries for sharper matches.`
                  : 'Your profile is complete. Matches are ranked by fit, then by deadline.'}
              </p>
              {completion < 100 && (
                <Link href="/dashboard/profile" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-700 hover:bg-accent-50">
                  <UserCircle className="h-4 w-4" /> Finish profile
                </Link>
              )}
            </div>
          </div>
          <dl className="flex gap-8 lg:gap-0 lg:divide-x lg:divide-white/20 shrink-0">
            <div className="lg:px-6">
              <dt className="text-xs text-brand-100">Next deadline</dt>
              <dd className="font-display text-2xl font-bold mt-1">{nextDeadline ? nextDeadline.date : 'None soon'}</dd>
            </div>
            <div className="lg:pl-6">
              <dt className="text-xs text-brand-100">Profile</dt>
              <dd className="font-display text-2xl font-bold mt-1">{completion}%</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-10">
        {stats.map(({ label, value, href, Icon, chip }) => (
          <Link key={label} href={href} className="group dash-panel p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-premium transition-all">
            <div className="flex items-center justify-between">
              <span className={cn('h-10 w-10 rounded-2xl ring-1 flex items-center justify-center', chip)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="h-8 w-8 rounded-full bg-surface-50 flex items-center justify-center text-ink-300 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4 font-display text-3xl font-semibold text-ink-900">{value}</div>
            <div className="text-xs font-semibold text-ink-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* Matches */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl text-ink-900">{matchedCount > 0 ? 'Matched for you' : 'Open scholarships'}</h2>
              <p className="text-sm text-ink-500 mt-1">Ranked by your profile, then by deadline.</p>
            </div>
            <Link href="/opportunities" className="rounded-full bg-white ring-1 ring-surface-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:text-ink-900 hover:ring-ink-200 inline-flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {display.length === 0 ? (
            <div className="dash-panel p-10 text-center text-ink-500">New opportunities are added daily. Check back soon.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {display.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} match={opp.score} />
              ))}
            </div>
          )}
        </section>

        {/* Side column */}
        <aside className="space-y-5">
          <section className="dash-dark p-5">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-accent-200" />
              </span>
              <div className="flex-1">
                <h2 className="font-bold text-white text-base">AI writing tools</h2>
                <p className="text-xs text-ink-300">Drafts in minutes, in your own words</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1">
              {TOOLS.map(({ href, label, icon: Icon, hint }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-white/[0.07] transition-colors">
                    <Icon className="h-4 w-4 text-accent-200 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-white">{label}</span>
                      <span className="block text-xs text-ink-300 truncate">{hint}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-white transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="dash-panel overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h2 className="font-bold text-ink-900 text-lg">Coming up</h2>
              <Link href="/dashboard/deadlines" className="rounded-full bg-surface-50 px-3 py-1 text-xs font-semibold text-ink-600 hover:text-ink-900">All deadlines</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-ink-500">
                Nothing you saved closes in the next 30 days. Save scholarships to see their deadlines here.
              </p>
            ) : (
              <ul className="px-2 pb-2">
                {upcoming.map(({ opportunity: o }) => {
                  const dl = deadlineInfo(o.deadline)
                  const urgent = dl.days !== null && dl.days <= 7
                  return (
                    <li key={o.id}>
                      <Link href={`/opportunities/${o.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-50">
                        <span className={cn('w-11 shrink-0 text-center rounded-xl py-1 ring-1', urgent ? 'bg-red-50 ring-red-100' : 'bg-amber-50 ring-amber-100')}>
                          <span className={cn('block text-[10px] font-bold uppercase', urgent ? 'text-red-600' : 'text-amber-700')}>{dl.date.split(' ')[1]}</span>
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

          <Link href="/dashboard/services/advisor" className="group flex items-center gap-4 rounded-3xl bg-accent-100 ring-1 ring-accent-200 p-5 hover:bg-accent-200/70 transition-colors">
            <span className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center text-brand-600 shrink-0">
              <Headset className="h-5 w-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-ink-900">Stuck on an application?</span>
              <span className="block text-sm text-ink-600">Book a session with an Xcel360 advisor.</span>
            </span>
            <ArrowRight className="h-4 w-4 text-brand-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </aside>
      </div>
    </div>
  )
}

/** Circular progress for profile completeness, drawn on the blue banner. */
function ProgressRing({ value }: { value: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-16 w-16 shrink-0" role="img" aria-label={`Profile ${value}% complete`}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {value >= 100 ? <Check className="h-6 w-6 text-white" /> : <span className="text-sm font-bold">{value}%</span>}
      </span>
    </div>
  )
}
