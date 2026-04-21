import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Calendar,
  BarChart3, FileText, Users, UserCheck, Award,
  FolderOpen, Briefcase, Activity, Mail,
} from 'lucide-react'
import { canAccess, isAdminRole, ROLE_LABELS } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import AdminSidebar from './AdminSidebar'

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
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar
        nav={nav}
        email={session.user.email ?? ''}
        roleLabel={roleInfo?.label ?? role}
      />

      {/* Desktop: offset by sidebar width. Mobile: offset by top bar height */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen p-4 lg:p-8">
        {children}
      </main>
    </div>
  )
}
