'use client'

/**
 * AppShell - the single unified shell for BOTH the user dashboard and the
 * admin panel. One sidebar (grouped, collapsible sections with PRO badges),
 * one mobile top bar, one set of interaction patterns. Parents pass
 * serializable nav descriptors (icon keys, not components) so server layouts
 * can use it too.
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
  SquareKanban, PenLine, LibraryBig, Headset, Sparkles, ChevronDown, Search,
  type LucideIcon,
} from 'lucide-react'
import Logo from '@/components/brand/Logo'
import { cn } from '@/lib/utils'

// Icon registry - parents reference icons by these string keys so props stay
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
  kanban: SquareKanban,
  pen: PenLine,
  library: LibraryBig,
  headset: Headset,
  sparkles: Sparkles,
  search: Search,
} as const

export type IconKey = keyof typeof ICONS

export interface NavChild {
  href: string
  label: string
}

export interface NavItem {
  href: string
  label: string
  icon: IconKey
  exact?: boolean
  badge?: 'PRO' | 'NEW'
  /** Sub-pages rendered as a collapsible tree under this item. */
  children?: NavChild[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

interface AppShellProps {
  /** Shown under the logo, e.g. "Admin". Omit for the plain dashboard. */
  brandTag?: string
  /** Nav sections rendered in order. */
  navGroups: NavGroup[]
  /** User card at the bottom of the sidebar. */
  user: {
    name: string
    email: string
    badgeLabel?: string
    badgeClass?: string
    admin?: boolean
  }
  /** Optional link rendered above the sign-out button (e.g. back to dashboard). */
  backLink?: { href: string; label: string }
  /** Optional promo card at the foot of the sidebar (e.g. Upgrade to Pro). */
  promo?: { title: string; text: string; href: string; cta: string }
  showSignOut?: boolean
  children: React.ReactNode
}

function matches(pathname: string, href: string, exact?: boolean) {
  const path = href.split('?')[0]
  return exact ? pathname === path : pathname === path || pathname.startsWith(path + '/')
}

function Badge({ kind }: { kind: 'PRO' | 'NEW' }) {
  return <span className={kind === 'PRO' ? 'pro-badge' : 'pro-badge !bg-accent-500'}>{kind}</span>
}

function NavEntry({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const Icon: LucideIcon = ICONS[item.icon]
  const childActive = item.children?.some((c) => matches(pathname, c.href)) ?? false
  const selfActive = matches(pathname, item.href, item.exact ?? !!item.children)
  const [open, setOpen] = useState(childActive || selfActive)

  useEffect(() => { if (childActive) setOpen(true) }, [childActive])

  const rowCls = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all w-full',
      active
        ? 'bg-white text-ink-900 font-semibold shadow-soft ring-1 ring-surface-200'
        : 'text-ink-600 hover:bg-white/70 hover:text-ink-900'
    )

  if (!item.children?.length) {
    return (
      <Link href={item.href} aria-current={selfActive ? 'page' : undefined} className={rowCls(selfActive)}>
        <Icon className={cn('h-[18px] w-[18px] shrink-0', selfActive ? 'text-accent-600' : 'text-ink-400')} />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && <Badge kind={item.badge} />}
      </Link>
    )
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={rowCls(selfActive || childActive)}>
        <Icon className={cn('h-[18px] w-[18px] shrink-0', selfActive || childActive ? 'text-accent-600' : 'text-ink-400')} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {item.badge && <Badge kind={item.badge} />}
        <ChevronDown className={cn('h-4 w-4 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="ml-[21px] mt-1 mb-1.5 border-l border-surface-300">
          {item.children.map((c) => {
            const active = matches(pathname, c.href)
            return (
              <li key={c.href} className="relative">
                <span aria-hidden className="absolute left-0 top-1/2 w-3 border-t border-surface-300" />
                <Link
                  href={c.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block ml-4 pl-2 pr-3 py-2 rounded-lg text-[13px] transition-colors',
                    active ? 'text-ink-900 font-semibold bg-white ring-1 ring-surface-200' : 'text-ink-500 hover:text-ink-900'
                  )}
                >
                  {c.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function AppShell({
  brandTag,
  navGroups,
  user,
  backLink,
  promo,
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
    <div className="flex flex-col h-full bg-surface-50">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 h-16 shrink-0 border-b border-surface-200">
        <Link href="/" aria-label="Xcel360 home">
          <Logo tag={brandTag} markClassName="h-8 w-8" />
        </Link>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="ml-auto p-1.5 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-ink-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {navGroups.map((group, gi) => (
          <div key={group.title} className={cn(gi > 0 && 'mt-6')}>
            <p className="text-[11px] font-bold text-ink-400 uppercase tracking-[0.14em] px-3 mb-2">{group.title}</p>
            <nav className="space-y-1" aria-label={group.title}>
              {group.items.map((item) => <NavEntry key={item.href + item.label} item={item} />)}
            </nav>
          </div>
        ))}

        {promo && (
          <Link href={promo.href} className="mt-6 block rounded-2xl bg-ink-900 p-4 text-white hover:bg-ink-800 transition-colors">
            <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent-300" /> {promo.title}</p>
            <p className="text-xs text-ink-200 mt-1 leading-relaxed">{promo.text}</p>
            <span className="mt-3 inline-block rounded-lg bg-accent-300 px-3 py-1.5 text-xs font-bold text-ink-900">{promo.cta}</span>
          </Link>
        )}
      </div>

      {/* User + footer actions */}
      <div className="px-3 py-3 border-t border-surface-200 shrink-0 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 bg-ink-900 text-accent-300 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-900 truncate">{user.name}</div>
            {user.badgeLabel ? (
              <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded mt-0.5', user.badgeClass ?? 'bg-surface-100 text-ink-600')}>
                {user.admin && <ShieldCheck className="h-3 w-3" />}
                {user.badgeLabel}
              </span>
            ) : (
              <div className="text-xs text-ink-400 truncate">{user.email}</div>
            )}
          </div>
        </div>
        {backLink && (
          <Link
            href={backLink.href}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-500 hover:bg-white hover:text-ink-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLink.label}
          </Link>
        )}
        {showSignOut && (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[264px] border-r border-surface-200 fixed inset-y-0 left-0 z-30">
        {sidebar()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[290px] max-w-[85vw] h-full flex flex-col shadow-xl">
            {sidebar(true)}
          </div>
        </div>
      )}

      {/* Main column */}
      <main className="md:ml-[264px] flex-1 flex flex-col min-h-screen min-w-0 bg-white">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-surface-200 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-700 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo tag={brandTag} markClassName="h-7 w-7" className="[&_span.font-display]:text-lg" />
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1400px] w-full">{children}</div>
      </main>
    </div>
  )
}
