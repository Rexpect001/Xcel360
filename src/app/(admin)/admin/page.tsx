export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Users, BookOpen, Bookmark, FileText, Calendar, UserCheck, TrendingUp, ArrowUpRight, Activity, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await getAuth()
  if (!session) redirect('/')
  const { isAdminRole } = await import('@/lib/permissions')
  if (!isAdminRole(session.user.role)) redirect('/')

  const db = prisma as any
  const [users, scholarships, jobs, internships, saved, applications, events, blogPosts, mentors] = await Promise.all([
    prisma.user.count(),
    db.opportunity.count({ where: { category: 'SCHOLARSHIP' } }),
    db.opportunity.count({ where: { category: 'JOB' } }),
    db.opportunity.count({ where: { category: 'INTERNSHIP' } }),
    prisma.savedOpportunity.count(),
    prisma.application.count(),
    prisma.event.count(),
    prisma.blogPost.count(),
    prisma.mentorshipOffering.count(),
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
    {
      href: '/admin/activity',      icon: Activity,  label: 'Activity Log',
      desc: 'Audit trail of all admin and user actions — logins, roles, content edits.',
      count: 'Live feed',
      iconColor: 'text-slate-600', iconBg: 'bg-slate-100',
      hoverBorder: 'hover:border-slate-300',
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
    </div>
  )
}
