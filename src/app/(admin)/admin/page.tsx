export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Users, BookOpen, Bookmark, FileText, Calendar, UserCheck, TrendingUp, ArrowRight, Activity, Briefcase } from 'lucide-react'
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
    { label: 'Total Users', value: users, icon: Users, color: 'bg-blue-50 text-blue-700', href: '/admin/users' },
    { label: 'Scholarships', value: scholarships, icon: BookOpen, color: 'bg-indigo-50 text-indigo-700', href: '/admin/opportunities' },
    { label: 'Jobs', value: jobs, icon: Briefcase, color: 'bg-emerald-50 text-emerald-700', href: '/admin/jobs' },
    { label: 'Internships', value: internships, icon: Briefcase, color: 'bg-purple-50 text-purple-700', href: '/admin/jobs' },
    { label: 'Total Saves', value: saved, icon: Bookmark, color: 'bg-green-50 text-green-700', href: '/admin/analytics' },
    { label: 'Applications', value: applications, icon: FileText, color: 'bg-orange-50 text-orange-700', href: '/admin/analytics' },
  ]

  const sections = [
    {
      href: '/admin/opportunities',
      icon: BookOpen,
      label: 'Scholarships',
      desc: 'Add, edit, delete scholarships and mark them as featured.',
      count: `${scholarships} total`,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      href: '/admin/jobs',
      icon: Briefcase,
      label: 'Jobs & Internships',
      desc: 'Post full-time jobs, internships, and remote opportunities.',
      count: `${jobs} jobs · ${internships} internships`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      href: '/admin/blog',
      icon: FileText,
      label: 'Blog & Guides',
      desc: 'Publish articles, scholarship guides, and tips for applicants.',
      count: `${blogPosts} posts`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      href: '/admin/mentorship',
      icon: UserCheck,
      label: 'Mentorship',
      desc: 'Manage mentor profiles, expertise, and booking links.',
      count: `${mentors} mentors`,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      href: '/admin/events',
      icon: Calendar,
      label: 'Events',
      desc: 'Post Zoom sessions, info sessions, and upcoming workshops.',
      count: `${events} events`,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      href: '/admin/users',
      icon: Users,
      label: 'Users',
      desc: 'View registered users and manage admin permissions.',
      count: `${users} users`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      href: '/admin/analytics',
      icon: TrendingUp,
      label: 'Analytics',
      desc: 'See most-viewed scholarships, user activity, and platform stats.',
      count: `${saved} saves`,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      href: '/admin/activity',
      icon: Activity,
      label: 'Activity Log',
      desc: 'Audit trail of all admin and user actions — logins, role changes, content edits.',
      count: 'Live feed',
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">Manage all content and users from one place.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5 group-hover:text-brand-600 transition-colors">{s.label}</div>
            </Link>
          )
        })}
      </div>

      {/* Action sections */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Manage Content</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${sec.bg} ${sec.color} flex items-center justify-center mb-4`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">{sec.label}</h3>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">{sec.desc}</p>
              <span className="text-xs font-medium text-gray-400">{sec.count}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
