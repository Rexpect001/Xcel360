export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Users, BookOpen, Bookmark, FileText, Calendar, UserCheck, TrendingUp, ArrowUpRight, Activity, Briefcase, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import RevalidateButton from '@/components/admin/RevalidateButton'
import DashHeader from '@/components/dashboard/DashHeader'

const ACTION_BADGE: Record<string, string> = {
  LOGIN: 'bg-success-100 text-success-700',
  LOGIN_FAILED: 'bg-danger-100 text-danger-700',
  LOGOUT: 'bg-surface-100 text-surface-700',
  SIGNUP: 'bg-brand-100 text-brand-700',
  OPPORTUNITY_CREATE: 'bg-brand-100 text-brand-700',
  OPPORTUNITY_LIST: 'bg-surface-100 text-surface-700',
  CREATE: 'bg-brand-100 text-brand-700',
  UPDATE: 'bg-warning-100 text-warning-700',
  DELETE: 'bg-danger-100 text-danger-700',
  PUBLISH: 'bg-success-100 text-success-700',
  UNPUBLISH: 'bg-warning-100 text-warning-700',
  ASSIGN_ROLE: 'bg-indigo-100 text-indigo-700',
  APPLY: 'bg-sky-100 text-sky-700',
  VIEW: 'bg-surface-100 text-surface-700',
  DOWNLOAD: 'bg-indigo-100 text-indigo-700',
}

export default async function AdminPage() {
  const session = await getAuth()
  if (!session) redirect('/')
  const { isAdminRole } = await import('@/lib/permissions')
  if (!isAdminRole(session.user.role)) redirect('/')

  const db = prisma as any
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [liveCount, expiredOpen, invalidDates] = await Promise.all([
    prisma.opportunity.count({ where: { status: 'OPEN', OR: [{ deadline: null }, { deadline: { gte: today } }] } }),
    prisma.opportunity.count({ where: { status: 'OPEN', deadline: { lt: today } } }),
    prisma.opportunity.count({ where: { deadline: { lt: new Date('2025-01-01') } } }),
  ])
  const [users, scholarships, jobs, internships, saved, applications, events, blogPosts, mentors, recentActivity] = await Promise.all([
    prisma.user.count(),
    db.opportunity.count({ where: { category: 'SCHOLARSHIP' } }),
    db.opportunity.count({ where: { category: 'JOB' } }),
    db.opportunity.count({ where: { category: 'INTERNSHIP' } }),
    prisma.savedOpportunity.count(),
    prisma.application.count(),
    prisma.event.count(),
    prisma.blogPost.count(),
    prisma.mentorshipOffering.count(),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
  ])

  const stats = [
    { label: 'Total Users',   value: users,        icon: Users,     href: '/admin/users',         tone: 'bg-brand-50 text-brand-700 border-brand-100' },
    { label: 'Scholarships',  value: scholarships, icon: BookOpen,  href: '/admin/opportunities', tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { label: 'Jobs',          value: jobs,         icon: Briefcase, href: '/admin/jobs',          tone: 'bg-success-50 text-success-700 border-success-100' },
    { label: 'Internships',   value: internships,  icon: Briefcase, href: '/admin/jobs',          tone: 'bg-sky-50 text-sky-700 border-sky-100' },
    { label: 'Total Saves',   value: saved,        icon: Bookmark,  href: '/admin/analytics',     tone: 'bg-rose-50 text-rose-700 border-rose-100' },
    { label: 'Applications',  value: applications, icon: FileText,  href: '/admin/analytics',     tone: 'bg-warning-50 text-warning-700 border-warning-100' },
  ]

  const sections = [
    {
      href: '/admin/opportunities', icon: BookOpen,  label: 'Scholarships',
      desc: 'Add, edit, delete scholarships and mark them as featured.',
      count: `${scholarships} total`,
      iconColor: 'text-violet-600', iconBg: 'bg-violet-50',
      hoverBorder: 'hover:border-violet-200',
    },
    {
      href: '/admin/jobs',          icon: Briefcase, label: 'Jobs & Internships',
      desc: 'Post full-time jobs, internships, and remote opportunities.',
      count: `${jobs} jobs | ${internships} internships`,
      iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50',
      hoverBorder: 'hover:border-emerald-200',
    },
    {
      href: '/admin/blog',          icon: FileText,  label: 'Blog & Guides',
      desc: 'Publish articles, scholarship guides, and tips for applicants.',
      count: `${blogPosts} posts`,
      iconColor: 'text-purple-600', iconBg: 'bg-purple-50',
      hoverBorder: 'hover:border-purple-200',
    },
    {
      href: '/admin/mentorship',    icon: UserCheck, label: 'Mentorship',
      desc: 'Manage mentor profiles, expertise, and booking links.',
      count: `${mentors} mentors`,
      iconColor: 'text-teal-600', iconBg: 'bg-teal-50',
      hoverBorder: 'hover:border-teal-200',
    },
    {
      href: '/admin/events',        icon: Calendar,  label: 'Events',
      desc: 'Post Zoom sessions, info sessions, and upcoming workshops.',
      count: `${events} events`,
      iconColor: 'text-amber-600', iconBg: 'bg-amber-50',
      hoverBorder: 'hover:border-amber-200',
    },
    {
      href: '/admin/users',         icon: Users,     label: 'Users',
      desc: 'View registered users and manage admin permissions.',
      count: `${users} users`,
      iconColor: 'text-blue-600', iconBg: 'bg-blue-50',
      hoverBorder: 'hover:border-blue-200',
    },
    {
      href: '/admin/analytics',     icon: TrendingUp,label: 'Analytics',
      desc: 'See most-viewed scholarships, user activity, and platform stats.',
      count: `${saved} saves`,
      iconColor: 'text-rose-600', iconBg: 'bg-rose-50',
      hoverBorder: 'hover:border-rose-200',
    },
  ]

  return (
    <div>
      <DashHeader
        eyebrow={`Welcome back, ${session.user.name?.split(' ')[0] ?? 'Admin'}`}
        title="Admin overview"
        subtitle="Everything on Xcel360 at a glance. Post, review and keep listings fresh."
        actions={
          <>
            <Link href="/admin/opportunities" className="btn-primary !py-2.5"><Plus className="h-4 w-4" /> Post a scholarship</Link>
            <Link href="/" target="_blank" className="btn-ghost border border-surface-200">View site</Link>
          </>
        }
      />

      {/* Listing health */}
      <div className="mb-10 grid sm:grid-cols-3 gap-3">
        <div className="paper-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Live on the site</p>
          <p className="font-display text-3xl text-ink-900 mt-2">{liveCount.toLocaleString()}</p>
          <p className="text-xs text-ink-500 mt-1">Open with a deadline today or later (or rolling).</p>
        </div>
        <div className="paper-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Expired, still marked open</p>
          <p className={`font-display text-3xl mt-2 ${expiredOpen > 0 ? 'text-amber-700' : 'text-ink-900'}`}>{expiredOpen.toLocaleString()}</p>
          <p className="text-xs text-ink-500 mt-1">Hidden from visitors. The daily job closes these automatically.</p>
        </div>
        <div className="paper-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Invalid dates (before 2025)</p>
          <p className={`font-display text-3xl mt-2 ${invalidDates > 0 ? 'text-red-700' : 'text-ink-900'}`}>{invalidDates.toLocaleString()}</p>
          <p className="text-xs text-ink-500 mt-1">{invalidDates > 0 ? 'Remove with scripts/purge-outdated-opportunities.mjs' : 'All clean.'}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="admin-card p-5 group hover:-translate-y-0.5 hover:shadow-premium transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-3xl font-semibold text-ink-900 leading-none">{s.value}</div>
                  <div className="text-xs font-medium mt-1.5 text-slate-500">{s.label}</div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.tone}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Section heading */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-brand-700" />
        <h2 className="admin-section-title">Manage Content</h2>
      </div>

      {/* Section cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className={`admin-card p-6 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium ${sec.hoverBorder}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sec.iconBg}`}>
                  <Icon className={`h-5 w-5 ${sec.iconColor}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
              </div>

              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-700 transition-colors">
                {sec.label}
              </h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">{sec.desc}</p>

              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg ${sec.iconBg} ${sec.iconColor}`}>
                {sec.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-slate-400" />
            <h2 className="admin-section-title">Recent Activity</h2>
          </div>
          <Link
            href="/admin/activity"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
          >
            View full log <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="admin-panel">
          {recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              No activity logged yet  -  events will appear here as users interact with the platform.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap text-xs">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">User</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs hidden md:table-cell">Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentActivity.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[160px] truncate">
                        {log.userEmail ?? <span className="text-slate-300 italic">anonymous</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_BADGE[log.action] ?? 'bg-slate-100 text-slate-500'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-xs text-slate-500">
                        {log.resource ? (
                          <span>
                            <span className="font-medium text-slate-600">{log.resource}</span>
                            {log.resourceName && <span className="text-slate-400"> | {log.resourceName}</span>}
                          </span>
                        ) : (
                          <span className="text-slate-300"> - </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Cache Control */}
      <div className="mt-10 admin-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-4 w-4 text-brand-600" />
          <h2 className="font-semibold text-slate-900 text-sm">Page Cache</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Public pages cache data for up to 1 hour. If you just published an event or scholarship and it isn&apos;t showing yet, flush the cache here.
        </p>
        <RevalidateButton />
      </div>
    </div>
  )
}
