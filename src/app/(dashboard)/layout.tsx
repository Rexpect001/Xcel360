'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'
import AppShell from '@/components/layout/AppShell'
import { ROLE_ACCESS, ROLE_LABELS, type UserRole } from '@/lib/permissions'
import { dashboardNavGroups } from '@/lib/nav'

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

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
      navGroups={dashboardNavGroups(allowedSections)}
      user={{
        name: session.user?.name ?? 'User',
        email: session.user?.email ?? '',
        badgeLabel: isPrivileged ? roleInfo?.label ?? role : undefined,
        badgeClass: roleInfo?.color,
        admin: isPrivileged,
      }}
      promo={{
        title: 'Xcel360 Launchpad',
        text: 'Plan and test a startup idea with guided AI tools.',
        href: '/dashboard/launchpad',
        cta: 'Explore Launchpad',
      }}
      showSignOut
    >
      {children}
    </AppShell>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  )
}
