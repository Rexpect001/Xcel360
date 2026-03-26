'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown, Bell, BookOpen, LogOut, User, LayoutDashboard, Shield, GraduationCap, Briefcase, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const opportunitiesDropdown = [
  { href: '/opportunities', label: 'Scholarships', icon: GraduationCap, desc: 'Funded study abroad programs' },
  { href: '/jobs', label: 'Jobs', icon: Briefcase, desc: 'Full-time & remote positions' },
  { href: '/internships', label: 'Internships', icon: Star, desc: 'Gain experience worldwide' },
]

const navLinks = [
  { href: '/mentorship', label: 'Mentorship' },
  { href: '/resources', label: 'Resources' },
  { href: '/events', label: 'Events & Programs' },
  { href: '/success-stories', label: 'Success Stories' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [oppsOpen, setOppsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const close = () => { setUserMenuOpen(false); setOppsOpen(false); setOpen(false) }
    if (userMenuOpen || oppsOpen) document.addEventListener('click', close, { once: true })
    return () => document.removeEventListener('click', close)
  }, [userMenuOpen, oppsOpen])

  const isHome = pathname === '/'
  const transparent = isHome && !scrolled

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      transparent
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative h-8 w-28">
              <Image
                src={transparent ? '/logo-white.jpg' : '/logo.jpg'}
                alt="Xcel360"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Opportunities dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOppsOpen(!oppsOpen)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  ['/opportunities', '/jobs', '/internships'].some(p => pathname.startsWith(p))
                    ? transparent ? 'text-white bg-white/10' : 'text-brand-700 bg-brand-50'
                    : transparent ? 'text-white/85 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-brand-700 hover:bg-brand-50'
                )}
              >
                Opportunities <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', oppsOpen && 'rotate-180')} />
              </button>
              {oppsOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                  {opportunitiesDropdown.map(({ href, label, icon: Icon, desc }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOppsOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-brand-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-brand-700" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? transparent
                      ? 'text-white bg-white/10'
                      : 'text-brand-700 bg-brand-50'
                    : transparent
                      ? 'text-white/85 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-brand-700 hover:bg-brand-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                    transparent
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-xs">
                      {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
                    </span>
                  </div>
                  <span className="max-w-[80px] truncate">{session.user.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-premium border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 mb-1 border-b border-gray-50">
                      <p className="text-xs font-semibold text-gray-900 truncate">{session.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                    <Link href="/dashboard/notifications" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                      <Bell className="h-4 w-4" /> Notifications
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors">
                        <Shield className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-1.5 border-gray-100" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className={cn(
                    'text-sm font-medium px-3 py-2 rounded-lg transition-colors',
                    transparent ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-brand-700'
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:from-brand-700 hover:to-brand-800 transition-all shadow-sm hover:shadow-md"
                >
                  Join Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className={cn('md:hidden p-2 rounded-xl transition-colors', transparent ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {opportunitiesDropdown.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-xl text-sm font-medium',
                  pathname === link.href ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-xl text-sm font-medium',
                  pathname === link.href ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-100 my-2" />
            {session ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">Dashboard</Link>
                <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">My Profile</Link>
                {session.user.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-xl">Admin Panel</Link>
                )}
                <button onClick={() => signOut({ callbackUrl: '/' })} className="block w-full text-left px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/signin" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">Sign In</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl text-center">Join Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
