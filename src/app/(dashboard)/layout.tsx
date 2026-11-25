'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'
import AppShell from '@/components/layout/AppShell'
import { ROLE_ACCESS, ROLE_LABELS, type UserRole } from '@/lib/permissions'
import { dashboardNavGroups } from '@/lib/nav'
import { FREE_CREDITS } from '@/lib/billing'
import { useUnreadNotifications } from '@/components/dashboard/useUnreadNotifications'

/** Fired by the writing tools with the new balance right after a draft. */
const CREDITS_EVENT = 'xcel:credits'

/** Live credit balance for the sidebar: loaded on each page change, updated after drafts. */
function useCreditBalance(enabled: boolean) {
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | null | undefined>(undefined)
  useEffect(() => {
    if (!enabled) return
    let live = true
    fetch('/api/me/credits')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live && d && 'credits' in d) setCredits(d.credits) })
      .catch(() => {})
    return () => { live = false }
  }, [enabled, pathname])
  useEffect(() => {
    const onChange = (e: Event) => {
      const n = (e as CustomEvent<number>).detail
      if (typeof n === 'number') setCredits(n)
    }
    window.addEventListener(CREDITS_EVENT, onChange)
    return () => window.removeEventListener(CREDITS_EVENT, onChange)
  }, [])
  return credits
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const credits = useCreditBalance(status === 'authenticated')
  const unread = useUnreadNotifications(status === 'authenticated')

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    redirect('/signin?callbackUrl=/dashboard')
  }

  const role = (session.user?.role ?? 'USER') as UserRole
  const roleInfo = ROLE_LABELS[role]
  const allowedSections = ROLE_ACCESS[role] ?? []
  const isPrivileged = allowedSections.length > 0

  return (
    <AppShell
      navGroups={withUnreadCount(withCreditLabel(dashboardNavGroups(allowedSections), credits), unread)}
      bell={{ href: '/dashboard/notifications', count: unread }}
      user={{
        name: session.user?.name ?? 'User',
        email: session.user?.email ?? '',
        badgeLabel: isPrivileged ? roleInfo?.label ?? role : undefined,
        badgeClass: roleInfo?.color,
        admin: isPrivileged,
      }}
      promo={{
        title: 'AI credits',
        text: `Every account gets ${FREE_CREDITS} free credits for the AI writing and Launchpad tools.`,
        href: '/dashboard/billing',
        cta: 'See my credits',
      }}
      showSignOut
    >
      {children}
    </AppShell>
  )
}

function withCreditLabel(groups: ReturnType<typeof dashboardNavGroups>, credits: number | null | undefined) {
  if (credits === undefined) return groups
  const label = credits === null ? 'Credits (unlimited)' : `Credits (${credits.toLocaleString()})`
  return groups.map((g) => ({ ...g, items: g.items.map((i) => (i.href === '/dashboard/billing' ? { ...i, label } : i)) }))
}

function withUnreadCount(groups: ReturnType<typeof dashboardNavGroups>, count: number | undefined) {
  if (!count) return groups
  return groups.map((g) => ({ ...g, items: g.items.map((i) => (i.href === '/dashboard/notifications' ? { ...i, count } : i)) }))
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  )
}
