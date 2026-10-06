import type { NavGroup, NavItem } from '@/components/layout/AppShell'

/**
 * Single source of truth for navigation across the unified shell.
 * Both the user dashboard and the admin panel render from these lists,
 * filtered by role where applicable. Icons are serializable keys (IconKey).
 */

export const OVERVIEW_NAV: NavItem[] = [
  { href: '/dashboard',               label: 'Dashboard',     icon: 'dashboard', exact: true },
  { href: '/dashboard/saved',         label: 'Pipeline',      icon: 'kanban' },
  { href: '/dashboard/applications',  label: 'Tracker',       icon: 'kanban' },
  { href: '/dashboard/deadlines',     label: 'Deadlines',     icon: 'calendar' },
  { href: '/dashboard/notifications', label: 'Notifications', icon: 'bell' },
]

export const MATERIALS_NAV: NavItem[] = [
  {
    href: '/dashboard/tools', label: 'Writing Tools', icon: 'pen',
    children: [
      { href: '/dashboard/tools/cv',           label: 'CV Builder' },
      { href: '/dashboard/tools/sop',          label: 'SOP Generator' },
      { href: '/dashboard/tools/cover-letter', label: 'Cover Letter Builder' },
      { href: '/dashboard/tools/cold-email',   label: 'Cold Email Generator' },
    ],
  },
  {
    href: '/dashboard/library', label: 'Resources', icon: 'library',
    children: [
      { href: '/dashboard/library/templates', label: 'Templates Library' },
      { href: '/dashboard/library/videos',    label: 'Video Hub' },
    ],
  },
]

export const SERVICES_NAV: NavItem[] = [
  { href: '/dashboard/launchpad', label: 'Launchpad', icon: 'sparkles', badge: 'NEW' },
  {
    href: '/dashboard/services', label: 'Services', icon: 'headset',
    children: [
      { href: '/dashboard/services',         label: 'All Services' },
      { href: '/dashboard/services/advisor', label: 'Speak With an Advisor' },
    ],
  },
  { href: '/dashboard/profile', label: 'My Profile', icon: 'user' },
]

// Kept for any page that still links the old personal list
export const PERSONAL_NAV: NavItem[] = [...OVERVIEW_NAV, { href: '/dashboard/profile', label: 'My Profile', icon: 'user' }]

// Admin sections - `section` matches ROLE_ACCESS entries in src/lib/permissions.ts
export interface AdminNavItem extends NavItem {
  section: string
  group: 'Overview' | 'Content' | 'Community' | 'Insights' | 'System'
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin',               section: '/',              group: 'Overview',  label: 'Overview',           icon: 'dashboard', exact: true },
  { href: '/admin/opportunities', section: '/opportunities', group: 'Content',   label: 'Scholarships',       icon: 'bookMarked' },
  { href: '/admin/jobs',          section: '/jobs',          group: 'Content',   label: 'Jobs & Internships', icon: 'briefcase' },
  { href: '/admin/blog',          section: '/blog',          group: 'Content',   label: 'News & Guides',      icon: 'bookOpen' },
  { href: '/admin/resources',     section: '/resources',     group: 'Content',   label: 'Resources',          icon: 'folder' },
  { href: '/admin/events',        section: '/events',        group: 'Community', label: 'Events',             icon: 'calendarDays' },
  { href: '/admin/programs',      section: '/programs',      group: 'Community', label: 'Programs',           icon: 'award' },
  { href: '/admin/mentorship',    section: '/mentorship',    group: 'Community', label: 'Mentorship',         icon: 'userCheck' },
  { href: '/admin/certificates',  section: '/certificates',  group: 'Community', label: 'Certificates',       icon: 'badgeCheck' },
  { href: '/admin/users',         section: '/users',         group: 'Insights',  label: 'Users',              icon: 'users' },
  { href: '/admin/analytics',     section: '/analytics',     group: 'Insights',  label: 'Analytics',          icon: 'barChart' },
  { href: '/admin/activity',      section: '/activity',      group: 'Insights',  label: 'Activity Log',       icon: 'activity' },
  { href: '/admin/contacts',      section: '/contacts',      group: 'System',    label: 'Contacts',           icon: 'contacts' },
  { href: '/admin/email',         section: '/email',         group: 'System',    label: 'Email',              icon: 'mail' },
  { href: '/admin/settings',      section: '/settings',      group: 'System',    label: 'Site Settings',      icon: 'settings' },
]

/** Filter admin nav by the sections a role may access. */
export function adminNavForRole(allowedSections: string[]): NavItem[] {
  return ADMIN_NAV.filter((item) => allowedSections.includes(item.section))
}

/** Admin nav split into labelled groups, empty groups dropped. */
export function adminNavGroups(allowedSections: string[]): NavGroup[] {
  const order: AdminNavItem['group'][] = ['Overview', 'Content', 'Community', 'Insights', 'System']
  return order
    .map((g) => ({ title: g, items: ADMIN_NAV.filter((i) => i.group === g && allowedSections.includes(i.section)) }))
    .filter((g) => g.items.length > 0)
}

/** Build the dashboard nav groups for a role. */
export function dashboardNavGroups(allowedSections: string[]): NavGroup[] {
  const groups: NavGroup[] = [
    { title: 'Overview', items: OVERVIEW_NAV },
    { title: 'Materials', items: MATERIALS_NAV },
    { title: 'Services', items: SERVICES_NAV },
  ]
  const adminItems = adminNavForRole(allowedSections)
  if (adminItems.length > 0) {
    groups.push({ title: 'Manage', items: [{ href: '/admin', label: 'Admin panel', icon: 'settings' }] })
  }
  return groups
}
