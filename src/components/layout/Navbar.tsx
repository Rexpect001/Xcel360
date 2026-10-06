'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Menu, X, ChevronDown, Bell, LogOut, User, LayoutDashboard, Shield,
  GraduationCap, Briefcase, Star, Award, Youtube, MessageCircle, Info, CirclePlay,
  type LucideIcon,
} from 'lucide-react'
import Logo from '@/components/brand/Logo'
import { cn } from '@/lib/utils'

type DropItem = { href: string; label: string; icon: LucideIcon; desc: string; external?: boolean }
type NavEntry =
  | { label: string; href: string; match?: string[] }
  | { label: string; items: DropItem[]; match: string[] }

const NAV: NavEntry[] = [
  {
    label: 'Opportunities',
    match: ['/opportunities', '/scholarships', '/jobs', '/internships'],
    items: [
      { href: '/opportunities', label: 'Scholarships', icon: GraduationCap, desc: 'Funded study at every level' },
      { href: '/internships', label: 'Internships', icon: Star, desc: 'Paid experience worldwide' },
      { href: '/jobs', label: 'Jobs', icon: Briefcase, desc: 'Full-time and remote roles' },
    ],
  },
  { label: 'Resources', href: '/resources' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  {
    label: 'About',
    match: ['/about', '/how-to-search', '/success-stories'],
    items: [
      { href: '/about', label: 'About Xcel360', icon: Info, desc: 'Our story and mission' },
      { href: '/how-to-search', label: 'How to search', icon: CirclePlay, desc: 'A 60-second walkthrough' },
      { href: '/success-stories', label: 'Success stories', icon: Award, desc: 'Wins from our community' },
      { href: 'https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30', label: 'WhatsApp channel', icon: MessageCircle, desc: 'Daily opportunity drops', external: true },
      { href: 'https://www.youtube.com/@Xcel_360', label: 'YouTube', icon: Youtube, desc: 'Application walkthroughs', external: true },
    ],
  },
]

function isActive(pathname: string, entry: NavEntry) {
  if ('items' in entry) return entry.match.some((p) => pathname.startsWith(p))
  return pathname === entry.href || pathname.startsWith(entry.href + '/')
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close any open menu on route change, outside click or Escape
  useEffect(() => { setOpenMenu(null); setMobileOpen(false) }, [pathname])
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(null) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const transparent = pathname === '/' && !scrolled && !mobileOpen
  const linkBase = 'px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-colors whitespace-nowrap'
  const linkTone = (active: boolean) =>
    transparent
      ? active ? 'text-white bg-white/10' : 'text-brand-50 hover:text-white hover:bg-white/10'
      : active ? 'text-ink-900 bg-surface-100' : 'text-ink-500 hover:text-ink-900 hover:bg-surface-100'

  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md border-b border-surface-200'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" aria-label="Xcel360 home" className="shrink-0">
            <Logo tone={transparent ? 'light' : 'ink'} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV.map((entry) =>
              'items' in entry ? (
                <div key={entry.label} className="relative">
                  <button
                    type="button"
                    aria-expanded={openMenu === entry.label}
                    onClick={() => setOpenMenu(openMenu === entry.label ? null : entry.label)}
                    className={cn(linkBase, linkTone(isActive(pathname, entry)), 'flex items-center gap-1')}
                  >
                    {entry.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openMenu === entry.label && 'rotate-180')} />
                  </button>
                  {openMenu === entry.label && (
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-premium border border-surface-200 p-2 z-50">
                      {entry.items.map(({ href, label, icon: Icon, desc, external }) => {
                        const inner = (
                          <>
                            <span className="w-9 h-9 bg-surface-100 rounded-lg flex items-center justify-center shrink-0 text-ink-700 group-hover:bg-accent-100 group-hover:text-accent-700 transition-colors">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-ink-900">{label}</span>
                              <span className="block text-xs text-ink-400">{desc}</span>
                            </span>
                          </>
                        )
                        const cls = 'group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors'
                        return external ? (
                          <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                        ) : (
                          <Link key={href} href={href} className={cls}>{inner}</Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={entry.href} href={entry.href} className={cn(linkBase, linkTone(isActive(pathname, entry)))}>
                  {entry.label}
                </Link>
              )
            )}
          </div>

          {/* Desktop account */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {session ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu(openMenu === 'user' ? null : 'user')}
                  className={cn(
                    'flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full text-sm font-semibold transition-colors',
                    transparent ? 'text-white hover:bg-white/10' : 'text-ink-700 hover:bg-surface-100'
                  )}
                >
                  <span className="w-7 h-7 bg-accent-300 text-ink-900 rounded-full flex items-center justify-center text-xs font-bold">
                    {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                  <span className="max-w-[90px] truncate">{session.user.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
                {openMenu === 'user' && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-premium border border-surface-200 p-2 z-50">
                    <div className="px-3 py-2 mb-1 border-b border-surface-100">
                      <p className="text-sm font-semibold text-ink-900 truncate">{session.user.name}</p>
                      <p className="text-xs text-ink-400 truncate">{session.user.email}</p>
                    </div>
                    {[
                      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                      { href: '/dashboard/profile', label: 'My profile', icon: User },
                      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
                    ].map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-surface-50 hover:text-ink-900">
                        <Icon className="h-4 w-4" /> {label}
                      </Link>
                    ))}
                    {session.user.role !== 'USER' && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-600 hover:bg-surface-50 hover:text-ink-900">
                        <Shield className="h-4 w-4" /> Admin panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="mt-1 flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className={cn('text-sm font-semibold px-3 py-2 rounded-lg transition-colors', transparent ? 'text-brand-50 hover:text-white' : 'text-ink-600 hover:text-ink-900')}
                >
                  Sign in
                </Link>
                <Link href="/signup" className={cn(transparent ? 'btn-light !border-transparent' : 'btn-primary', '!px-4 !py-2 !rounded-lg')}>
                  Join free
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn('lg:hidden p-2 rounded-lg transition-colors', transparent ? 'text-white hover:bg-white/10' : 'text-ink-700 hover:bg-surface-100')}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-surface-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {NAV.map((entry) =>
              'items' in entry ? (
                <div key={entry.label} className="pt-2">
                  <p className="px-3 pb-1 eyebrow !text-ink-400">{entry.label}</p>
                  {entry.items.map(({ href, label, icon: Icon, external }) =>
                    external ? (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-700 hover:bg-surface-50">
                        <Icon className="h-4 w-4 text-ink-400" /> {label}
                      </a>
                    ) : (
                      <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-700 hover:bg-surface-50">
                        <Icon className="h-4 w-4 text-ink-400" /> {label}
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={cn('block px-3 py-2.5 rounded-xl text-sm font-semibold', isActive(pathname, entry) ? 'bg-surface-100 text-ink-900' : 'text-ink-700 hover:bg-surface-50')}
                >
                  {entry.label}
                </Link>
              )
            )}
            <hr className="border-surface-200 !my-3" />
            {session ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-surface-50 rounded-xl">Dashboard</Link>
                {session.user.role !== 'USER' && (
                  <Link href="/admin" className="block px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-surface-50 rounded-xl">Admin panel</Link>
                )}
                <button onClick={() => signOut({ callbackUrl: '/' })} className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl">Sign out</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pb-2">
                <Link href="/signin" className="text-center px-3 py-2.5 text-sm font-semibold text-ink-700 border border-surface-200 rounded-xl">Sign in</Link>
                <Link href="/signup" className="btn-primary !py-2.5">Join free</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
