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
    {
      label: 'Total Users',
      value: users,
      icon: Users,
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      href: '/admin/users',
    },
    {
      label: 'Scholarships',
      value: scholarships,
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      href: '/admin/opportunities',
    },
    {
      label: 'Jobs',
      value: jobs,
      icon: Briefcase,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      href: '/admin/jobs',
    },
    {
      label: 'Internships',
      value: internships,
      icon: Briefcase,
      gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)',
      href: '/admin/jobs',
    },
    {
      label: 'Total Saves',
      value: saved,
      icon: Bookmark,
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      href: '/admin/analytics',
    },
    {
      label: 'Applications',
      value: applications,
      icon: FileText,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      href: '/admin/analytics',
    },
  ]

  const sections = [
    {
      href: '/admin/opportunities',
      icon: BookOpen,
      label: 'Scholarships',
      desc: 'Add, edit, delete scholarships and mark them as featured.',
      count: `${scholarships} total`,
      accent: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)',
    },
    {
      href: '/admin/jobs',
      icon: Briefcase,
      label: 'Jobs & Internships',
      desc: 'Post full-time jobs, internships, and remote opportunities.',
      count: `${jobs} jobs · ${internships} internships`,
      accent: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
    },
    {
      href: '/admin/blog',
      icon: FileText,
      label: 'Blog & Guides',
      desc: 'Publish articles, scholarship guides, and tips for applicants.',
      count: `${blogPosts} posts`,
      accent: '#a855f7',
      bg: 'rgba(168,85,247,0.08)',
    },
    {
      href: '/admin/mentorship',
      icon: UserCheck,
      label: 'Mentorship',
      desc: 'Manage mentor profiles, expertise, and booking links.',
      count: `${mentors} mentors`,
      accent: '#14b8a6',
      bg: 'rgba(20,184,166,0.08)',
    },
    {
      href: '/admin/events',
      icon: Calendar,
      label: 'Events',
      desc: 'Post Zoom sessions, info sessions, and upcoming workshops.',
      count: `${events} events`,
      accent: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
    },
    {
      href: '/admin/users',
      icon: Users,
      label: 'Users',
      desc: 'View registered users and manage admin permissions.',
      count: `${users} users`,
      accent: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)',
    },
    {
      href: '/admin/analytics',
      icon: TrendingUp,
      label: 'Analytics',
      desc: 'See most-viewed scholarships, user activity, and platform stats.',
      count: `${saved} saves`,
      accent: '#f43f5e',
      bg: 'rgba(244,63,94,0.08)',
    },
    {
      href: '/admin/activity',
      icon: Activity,
      label: 'Activity Log',
      desc: 'Audit trail of all admin and user actions — logins, roles, content edits.',
      count: 'Live feed',
      accent: '#64748b',
      bg: 'rgba(100,116,139,0.08)',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>
          Welcome back
        </p>
        <h1 className="text-3xl font-bold" style={{ color: '#0f172a' }}>Admin Overview</h1>
        <p className="mt-1" style={{ color: '#64748b' }}>Manage all content and users from one place.</p>
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
              style={{ background: s.gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            >
              {/* Subtle gloss overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.08)' }} />

              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <Icon className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="text-3xl font-bold text-white leading-none">{s.value}</div>
                <div className="text-xs font-medium mt-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Section cards */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg,#3b82f6,#8b5cf6)' }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Manage Content</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className="bg-white rounded-2xl p-6 group transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Icon + arrow row */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: sec.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: sec.accent }} />
                </div>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                  style={{ background: sec.bg }}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" style={{ color: sec.accent }} />
                </div>
              </div>

              <h3 className="font-semibold mb-1 group-hover:transition-colors"
                style={{ color: '#0f172a' }}
                onMouseEnter={e => (e.currentTarget.style.color = sec.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}
              >
                {sec.label}
              </h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#64748b' }}>{sec.desc}</p>

              {/* Count pill */}
              <span
                className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: sec.bg, color: sec.accent }}
              >
                {sec.count}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
