import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccess, isAdminRole, ROLE_LABELS } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import AdminSidebar from './AdminSidebar'

const ALL_SECTIONS = [
  '/', '/opportunities', '/jobs', '/programs', '/resources',
  '/blog', '/mentorship', '/events', '/certificates', '/users', '/analytics', '/activity', '/email',
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth()
  if (!session || !isAdminRole(session.user.role)) redirect('/')

  const role = session.user.role
  const roleInfo = ROLE_LABELS[role as UserRole]

  // Pass only plain strings — React components (icons) live in the client component
  const allowedSections = ALL_SECTIONS.filter(section => canAccess(role, section))

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar
        allowedSections={allowedSections}
        email={session.user.email ?? ''}
        roleLabel={roleInfo?.label ?? role}
      />
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen p-4 lg:p-8">
        {children}
      </main>
    </div>
  )
}
