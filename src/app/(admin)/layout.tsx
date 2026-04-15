import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap, LayoutDashboard, BookOpen, Calendar,
  BarChart3, ArrowLeft, FileText, Users, UserCheck, Award,
  FolderOpen, Briefcase, Activity, ShieldCheck, Mail
} from 'lucide-react'
import { canAccess, isAdminRole, ROLE_LABELS } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'

const ALL_NAV = [
  { href: '/admin',               section: '/',              label: 'Overview',           icon: LayoutDashboard },
  { href: '/admin/opportunities', section: '/opportunities', label: 'Scholarships',        icon: BookOpen },
  { href: '/admin/jobs',          section: '/jobs',          label: 'Jobs & Internships',  icon: Briefcase },
  { href: '/admin/programs',      section: '/programs',      label: 'Programs',            icon: Award },
  { href: '/admin/resources',     section: '/resources',     label: 'Resources',           icon: FolderOpen },
  { href: '/admin/blog',          section: '/blog',          label: 'Blog & Guides',       icon: FileText },
  { href: '/admin/mentorship',    section: '/mentorship',    label: 'Mentorship',          icon: UserCheck },
  { href: '/admin/events',        section: '/events',        label: 'Events',              icon: Calendar },
  { href: '/admin/users',         section: '/users',         label: 'Users',               icon: Users },
  { href: '/admin/analytics',     section: '/analytics',     label: 'Analytics',           icon: BarChart3 },
  { href: '/admin/activity',      section: '/activity',      label: 'Activity Log',        icon: Activity },
  { href: '/admin/email',         section: '/email',         label: 'Email',               icon: Mail },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth()
  if (!session || !isAdminRole(session.user.role)) redirect('/')

  const role = session.user.role
  const roleInfo = ROLE_LABELS[role as UserRole]
  const nav = ALL_NAV.filter((item) => canAccess(role, item.section))

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ── Sidebar ── */}
      <aside className="w-64 fixed inset-y-0 flex flex-col z-10 bg-[#0f172a]">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shrink-0 bg-gradient-to-br from-blue-400 to-blue-700">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">Xcel360</div>
            <div className="text-xs font-medium text-blue-400">Admin Panel</div>
          </div>
        </div>

        {/* Role badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.08]">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/20">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
            <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded-md mt-0.5 bg-indigo-500/25 text-indigo-200">
              {roleInfo?.label ?? role}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/[0.07] hover:text-white transition-all"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.07]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-64 flex-1 p-8 min-h-screen">{children}</main>
    </div>
  )
}
