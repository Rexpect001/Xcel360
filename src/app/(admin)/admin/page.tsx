export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Users, BookOpen, Bookmark, FileText, Calendar, UserCheck, TrendingUp, ArrowUpRight, Activity, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import RevalidateButton from '@/components/admin/RevalidateButton'

const ACTION_BADGE: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  SIGNUP: 'bg-teal-100 text-teal-700',
  OPPORTUNITY_CREATE: 'bg-blue-100 text-blue-700',
  OPPORTUNITY_LIST: 'bg-gray-100 text-gray-500',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PUBLISH: 'bg-green-100 text-green-700',
  UNPUBLISH: 'bg-orange-100 text-orange-700',
  ASSIGN_ROLE: 'bg-purple-100 text-purple-700',
  APPLY: 'bg-cyan-100 text-cyan-700',
  VIEW: 'bg-gray-100 text-gray-400',
  DOWNLOAD: 'bg-violet-100 text-violet-700',
}

export default async function AdminPage() {
  const session = await getAuth()
  if (!session) redirect('/')
  const { isAdminRole } = await import('@/lib/permissions')
  if (!isAdminRole(session.user.role)) redirect('/')

  const db = prisma as any
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
    { label: 'Total Users',   value: users,        icon: Users,    from: '#3b82f6', to: '#1d4ed8', href: '/admin/users' },
    { label: 'Scholarships',  value: scholarships,  icon: BookOpen, from: '#8b5cf6', to: '#6d28d9', href: '/admin/opportunities' },
    { label: 'Jobs',          value: jobs,          icon: Briefcase,from: '#10b981', to: '#059669', href: '/admin/jobs' },
    { label: 'Internships',   value: internships,   icon: Briefcase,from: '#06b6d4', to: '#0284c7', href: '/admin/jobs' },
    { label: 'Total Saves',   value: saved,         icon: Bookmark, from: '#f43f5e', to: '#e11d48', href: '/admin/analytics' },
    { label: 'Applications',  value: applications,  icon: FileText, from: '#f59e0b', to: '#d97706', href: '/admin/analytics' },
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
      count: `${jobs} jobs · ${internships} internships`,
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
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Welcome back</p>
        <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
        <p className="mt-1 text-slate-500">Manage all content and users from one place.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="relative rounded-2xl p-5 overflow-hidden group hover:-translate-y-1 transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
                boxShadow: `0 4px 20px ${s.from}40`,
              }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.08] transition-all duration-200 rounded-2xl" />
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/20">
                  <Icon className="text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="text-3xl font-bold text-white leading-none">{s.value}</div>
                <div className="text-xs font-medium mt-1.5 text-white/75">{s.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Section heading */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Manage Content</h2>
      </div>

      {/* Section cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className={`bg-white rounded-2xl p-6 group border border-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${sec.hoverBorder}`}
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

      {/* ── Recent Activity ── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-slate-400 to-slate-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recent Activity</h2>
          </div>
          <Link
            href="/admin/activity"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
          >
            View full log <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              No activity logged yet  -  events will appear here as users interact with the platform.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
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
                            {log.resourceName && <span className="text-slate-400"> · {log.resourceName}</span>}
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
      <div className="mt-10 bg-white rounded-2xl border border-slate-100 p-6">
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
