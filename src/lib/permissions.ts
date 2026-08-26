export type UserRole = 'USER' | 'EDITOR' | 'MODERATOR' | 'MENTOR' | 'MANAGER' | 'ADMIN'

// Which admin panel sections each role can access (path suffix after /admin)
export const ROLE_ACCESS: Record<string, string[]> = {
  ADMIN:     ['/', '/opportunities', '/jobs', '/programs', '/resources', '/blog', '/mentorship', '/events', '/certificates', '/users', '/analytics', '/activity', '/contacts', '/email', '/settings'],
  MANAGER:   ['/', '/opportunities', '/jobs', '/programs', '/resources', '/blog', '/events', '/certificates'],
  EDITOR:    ['/', '/opportunities', '/jobs', '/resources', '/blog', '/events'],
  MENTOR:    ['/', '/resources', '/blog', '/mentorship', '/events'],
  MODERATOR: ['/', '/events'],
}

export function canAccess(role: string, section: string): boolean {
  return ROLE_ACCESS[role]?.includes(section) ?? false
}

export function isAdminRole(role: string): boolean {
  return ['ADMIN', 'MANAGER', 'EDITOR', 'MODERATOR', 'MENTOR'].includes(role)
}

export const ROLE_LABELS: Record<UserRole, { label: string; color: string; description: string }> = {
  USER:      { label: 'User',      color: 'bg-gray-100 text-gray-700',   description: 'Standard user  -  can browse, save, and apply to scholarships' },
  EDITOR:    { label: 'Editor',    color: 'bg-yellow-100 text-yellow-700', description: 'Can manage scholarships, jobs, resources, blog posts, and events' },
  MODERATOR: { label: 'Moderator', color: 'bg-orange-100 text-orange-700', description: 'Can manage events' },
  MENTOR:    { label: 'Mentor',    color: 'bg-purple-100 text-purple-700', description: 'Can manage resources, blog, mentorship listings, and events' },
  MANAGER:   { label: 'Manager',   color: 'bg-blue-100 text-blue-700',   description: 'Can manage scholarships, jobs, programs, resources, blog, and events' },
  ADMIN:     { label: 'Admin',     color: 'bg-red-100 text-red-700',     description: 'Super admin  -  full access including users, roles, and activity logs' },
}
