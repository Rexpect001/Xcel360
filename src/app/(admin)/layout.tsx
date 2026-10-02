import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdminRole, ROLE_ACCESS, ROLE_LABELS } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import AppShell from '@/components/layout/AppShell'
import SessionProvider from '@/components/providers/SessionProvider'
import { adminNavGroups } from '@/lib/nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth()
  if (!session || !isAdminRole(session.user.role)) redirect('/')

  const role = session.user.role as UserRole
  const roleInfo = ROLE_LABELS[role]
  const allowedSections = ROLE_ACCESS[role] ?? []

  return (
    <SessionProvider>
    <AppShell
      brandTag="Admin"
      navGroups={adminNavGroups(allowedSections)}
      user={{
        name: session.user.name ?? session.user.email ?? 'Admin',
        email: session.user.email ?? '',
        badgeLabel: roleInfo?.label ?? role,
        badgeClass: roleInfo?.color,
        admin: true,
      }}
      backLink={{ href: '/dashboard', label: 'Back to Dashboard' }}
      showSignOut
    >
      {children}
    </AppShell>
    </SessionProvider>
  )
}
