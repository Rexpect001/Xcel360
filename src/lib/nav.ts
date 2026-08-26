import type { NavGroup, NavItem } from '@/components/layout/AppShell'

/**
 * Single source of truth for navigation across the unified shell.
 * Both the user dashboard and the admin panel render from these lists,
 * filtered by role where applicable. Icons are serializable keys (IconKey).
 */

export const PERSONAL_NAV: NavItem[] = [
  { href: '/dashboard',               label: 'Overview',       icon: 'dashboard', exact: true },
  { href: '/dashboard/saved',         label: 'Saved',          icon: 'bookmark' },
  { href: '/dashboard/applications',  label: 'Applications',   icon: 'fileText' },
  { href: '/dashboard/deadlines',     label: 'Deadlines',      icon: 'calendar' },
  { href: '/dashboard/notifications', label: 'Notifications',  icon: 'bell' },
  { href: '/dashboard/profile',       label: 'My Profile',     icon: 'user' },
]

export const QUICK_LINKS: NavItem[] = [
  { href: '/opportunities', label: 'Scholarships',   icon: 'graduationCap' },
  { href: '/events',        label: 'Events',         icon: 'calendarDays' },
  { href: '/resources',     label: 'Resources',      icon: 'bookOpen' },
  { href: '/mentorship',    label: 'Find a Mentor',  icon: 'users2' },
]

// Admin sections — `section` matches ROLE_ACCESS entries in src/lib/permissions.ts
export interface AdminNavItem extends NavItem {
  section: string
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin',               section: '/',              label: 'Overview',           icon: 'dashboard', exact: true },
  { href: '/admin/opportunities', section: '/opportunities', label: 'Scholarships',        icon: 'bookMarked' },
  { href: '/admin/jobs',          section: '/jobs',          label: 'Jobs & Internships',  icon: 'briefcase' },
  { href: '/admin/programs',      section: '/programs',      label: 'Programs',            icon: 'award' },
  { href: '/admin/resources',     section: '/resources',     label: 'Resources',           icon: 'folder' },
  { href: '/admin/blog',          section: '/blog',          label: 'Blog & Guides',       icon: 'bookOpen' },
  { href: '/admin/mentorship',    section: '/mentorship',    label: 'Mentorship',          icon: 'userCheck' },
  { href: '/admin/events',        section: '/events',        label: 'Events',              icon: 'calendarDays' },
  { href: '/admin/certificates',  section: '/certificates',  label: 'Certificates',        icon: 'badgeCheck' },
  { href: '/admin/users',         section: '/users',         label: 'Users',               icon: 'users' },
  { href: '/admin/analytics',     section: '/analytics',     label: 'Analytics',           icon: 'barChart' },
  { href: '/admin/activity',      section: '/activity',      label: 'Activity Log',        icon: 'activity' },
  { href: '/admin/contacts',      section: '/contacts',      label: 'Contacts',            icon: 'contacts' },
  { href: '/admin/email',         section: '/email',         label: 'Email',               icon: 'mail' },
  { href: '/admin/settings',      section: '/settings',      label: 'Site Settings',       icon: 'settings' },
]

/** Filter admin nav by the sections a role may access. */
export function adminNavForRole(allowedSections: string[]): NavItem[] {
  return ADMIN_NAV.filter((item) => allowedSections.includes(item.section))
}

/** Build the dashboard nav groups for a role. */
export function dashboardNavGroups(allowedSections: string[]): NavGroup[] {
  const groups: NavGroup[] = [{ title: 'My Dashboard', items: PERSONAL_NAV }]
  const adminItems = adminNavForRole(allowedSections)
  if (adminItems.length > 0) {
    groups.push({ title: 'Manage', items: adminItems })
  } else {
    groups.push({ title: 'Quick Access', items: QUICK_LINKS })
  }
  return groups
}
