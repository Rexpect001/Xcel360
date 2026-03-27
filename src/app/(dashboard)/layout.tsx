'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bookmark, FileText, Calendar, Bell,
  GraduationCap, LogOut, Menu, X, UserCircle, BookOpen, Users2,
  CalendarDays, BookMarked, Briefcase, Award, UserCheck,
  Users, BarChart3, Activity, FolderOpen
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import SessionProvider from '@/components/providers/SessionProvider'
import { ROLE_ACCESS, ROLE_LABELS, type UserRole } from '@/lib/permissions'

const personalNav = [
  { href: '/dashboard',               label: 'Overview',       icon: LayoutDashboard, exact: true },
  { href: '/dashboard/saved',         label: 'Saved',          icon: Bookmark },
  { href: '/dashboard/applications',  label: 'Applications',   icon: FileText },
  { href: '/dashboard/deadlines',     label: 'Deadlines',      icon: Calendar },
  { href: '/dashboard/notifications', label: 'Notifications',  icon: Bell },
  { href: '/dashboard/profile',       label: 'My Profile',     icon: UserCircle },
]

const quickLinks = [
  { href: '/opportunities', label: 'Scholarships',  icon: GraduationCap },
  { href: '/events',        label: 'Events',         icon: CalendarDays },
  { href: '/resources',     label: 'Resources',      icon: BookOpen },
  { href: '/mentorship',    label: 'Find a Mentor',  icon: Users2 },
]

// All admin sections — matched to ROLE_ACCESS sections
const adminSections = [
  { section: '/opportunities', href: '/admin/opportunities', label: 'Scholarships',     icon: BookMarked },
  { section: '/jobs',          href: '/admin/jobs',          label: 'Jobs & Internships', icon: Briefcase },
  { section: '/programs',      href: '/admin/programs',      label: 'Programs',          icon: Award },
  { section: '/resources',     href: '/admin/resources',     label: 'Resources',         icon: FolderOpen },
  { section: '/blog',          href: '/admin/blog',          label: 'Blog & Guides',     icon: BookOpen },
  { section: '/mentorship',    href: '/admin/mentorship',    label: 'Mentorship',        icon: UserCheck },
  { section: '/events',        href: '/admin/events',        label: 'Events',            icon: CalendarDays },
  { section: '/users',         href: '/admin/users',         label: 'Users',             icon: Users },
  { section: '/analytics',     href: '/admin/analytics',     label: 'Analytics',         icon: BarChart3 },
  { section: '/activity',      href: '/admin/activity',      label: 'Activity Log',      icon: Activity },
]

function DashboardSidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? 'USER'
  const roleInfo = ROLE_LABELS[role as UserRole]

  // Filter admin sections this role can access
  const myAdminSections = adminSections.filter((s) =>
    ROLE_ACCESS[role]?.includes(s.section)
  )
  const isPrivileged = myAdminSections.length > 0

  return (
    <div className={cn('flex flex-col h-full overflow-y-auto', mobile ? 'p-4' : '')}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 shrink-0">
        <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">
          Xcel<span className="text-brand-600">360</span>
        </span>
      </div>

      {/* User info */}
      <div className="mx-3 mb-4 p-3 bg-brand-50 rounded-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{session?.user?.name}</div>
            {isPrivileged ? (
              <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded-md mt-0.5 ${roleInfo?.color ?? 'bg-gray-100 text-gray-600'}`}>
                {roleInfo?.label ?? role}
              </span>
            ) : (
              <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Personal nav ── */}
      <div className="px-3 shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">My Dashboard</p>
        <nav className="space-y-0.5">
          {personalNav.map((item) => {
            const Icon = item.icon
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Manage section (privileged roles only) ── */}
      {isPrivileged && (
        <div className="px-3 mt-4 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">Manage</p>
          <nav className="space-y-0.5">
            {myAdminSections.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* ── Quick links (regular users only) ── */}
      {!isPrivileged && (
        <div className="px-3 mt-4 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">Quick Access</p>
          <nav className="space-y-0.5">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    redirect('/signin?callbackUrl=/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0">
        <DashboardSidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-64 bg-white h-full flex flex-col shadow-xl">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <DashboardSidebar mobile onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-700 rounded flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Xcel<span className="text-brand-600">360</span></span>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  )
}
