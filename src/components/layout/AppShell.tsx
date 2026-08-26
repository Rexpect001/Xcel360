'use client'

/**
 * AppShell — the single unified shell for BOTH the user dashboard and the
 * admin panel. One sidebar, one mobile top bar, one set of interaction
 * patterns. Parents pass serializable nav descriptors (icon keys, not
 * components) so server layouts can use it too.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Bookmark, FileText, Calendar, Bell, UserCircle,
  GraduationCap, BookOpen, Users2, CalendarDays, BookMarked, Briefcase,
  Award, UserCheck, Users, BarChart3, Activity, FolderOpen, Settings,
  ContactRound, Mail, BadgeCheck, LogOut, Menu, X, ArrowLeft, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon registry — parents reference icons by these string keys so props stay
// serializable across the server/client boundary.
const ICONS = {
  dashboard: LayoutDashboard,
  bookmark: Bookmark,
  fileText: FileText,
  calendar: Calendar,
  bell: Bell,
  user: UserCircle,
  graduationCap: GraduationCap,
  bookOpen: BookOpen,
  users2: Users2,
  calendarDays: CalendarDays,
  bookMarked: BookMarked,
  briefcase: Briefcase,
  award: Award,
  userCheck: UserCheck,
  users: Users,
  barChart: BarChart3,
  activity: Activity,
  folder: FolderOpen,
  settings: Settings,
  contacts: ContactRound,
  mail: Mail,
  badgeCheck: BadgeCheck,
} as const

export type IconKey = keyof typeof ICONS

export interface NavItem {
  href: string
  label: string
  icon: IconKey
  exact?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

interface AppShellProps {
  /** Shown under the logo, e.g. "Admin Panel". Omit for the plain dashboard. */
  brandTag?: string
  /** Nav sections rendered in order. */
  navGroups: NavGroup[]
  /** User card at the top of the sidebar. */
  user: {
    name: string
    email: string
    badgeLabel?: string
    badgeClass?: string
    admin?: boolean
  }
  /** Optional link rendered above the sign-out button (e.g. back to dashboard). */
  backLink?: { href: string; label: string }
  /** Render the sign-out button (dashboard) or omit it (admin has its own flow). */
  showSignOut?: boolean
  children: React.ReactNode
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const Icon: LucideIcon = ICONS[item.icon]
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        isActive
          ? 'bg-brand-700 text-white shadow-sm'
          : 'text-gray-600 hover:bg-brand-50 hover:text-brand-800'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}

export default function AppShell({
  brandTag,
  navGroups,
  user,
  backLink,
  showSignOut = true,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const sidebar = (mobile = false) => (
    <div className={cn('flex flex-col h-full overflow-y-auto bg-white', mobile && 'p-2')}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-glow-sm shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold text-gray-900 leading-tight">
            Xcel<span className="text-brand-600">360</span>
          </div>
          {brandTag && <div className="text-[11px] font-medium text-gray-400">{brandTag}</div>}
        </div>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User card */}
      <div className="mx-3 mb-4 p-3 bg-brand-50 border border-brand-100/60 rounded-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
            {user.badgeLabel ? (
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md mt-0.5',
                user.badgeClass ?? 'bg-gray-100 text-gray-600'
              )}>
                {user.admin && <ShieldCheck className="h-3 w-3" />}
                {user.badgeLabel}
              </span>
            ) : (
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Nav groups */}
      {navGroups.map((group, gi) => (
        <div key={group.title} className={cn('px-3 shrink-0', gi > 0 && 'mt-4')}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
            {group.title}
          </p>
          <nav className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={() => setMobileOpen(false)} />
            ))}
          </nav>
        </div>
      ))}

      <div className="flex-1 min-h-4" />

      {/* Footer actions */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0 space-y-0.5">
        {backLink && (
          <Link
            href={backLink.href}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        )}
        {showSignOut && (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        {sidebar()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl">
            {sidebar(true)}
          </div>
        </div>
      )}

      {/* Main column */}
      <main className="md:ml-64 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-700 rounded-md flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">
              Xcel<span className="text-brand-600">360</span>
              {brandTag && <span className="text-gray-400 font-medium"> · {brandTag}</span>}
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
