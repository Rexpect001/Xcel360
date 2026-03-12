export type UserRole = 'USER' | 'EDITOR' | 'MODERATOR' | 'MENTOR' | 'MANAGER' | 'ADMIN'

// What each role can do
export const ROLE_PERMISSIONS: Record<UserRole, {
  canPublish: boolean
  canDelete: boolean
  canManageUsers: boolean
  canAssignRoles: boolean
  canViewActivityLog: boolean
  canManageContent: boolean
  canViewMentorDashboard: boolean
  canModerate: boolean
  canManagePrograms: boolean
}> = {
  USER: {
    canPublish: false, canDelete: false, canManageUsers: false,
    canAssignRoles: false, canViewActivityLog: false, canManageContent: false,
    canViewMentorDashboard: false, canModerate: false, canManagePrograms: false,
  },
  EDITOR: {
    canPublish: false, canDelete: false, canManageUsers: false,
    canAssignRoles: false, canViewActivityLog: false, canManageContent: true,
    canViewMentorDashboard: false, canModerate: false, canManagePrograms: false,
  },
  MODERATOR: {
    canPublish: false, canDelete: false, canManageUsers: false,
    canAssignRoles: false, canViewActivityLog: true, canManageContent: false,
    canViewMentorDashboard: false, canModerate: true, canManagePrograms: false,
  },
  MENTOR: {
    canPublish: false, canDelete: false, canManageUsers: false,
    canAssignRoles: false, canViewActivityLog: false, canManageContent: false,
    canViewMentorDashboard: true, canModerate: false, canManagePrograms: false,
  },
  MANAGER: {
    canPublish: true, canDelete: true, canManageUsers: false,
    canAssignRoles: false, canViewActivityLog: true, canManageContent: true,
    canViewMentorDashboard: true, canModerate: true, canManagePrograms: true,
  },
  ADMIN: {
    canPublish: true, canDelete: true, canManageUsers: true,
    canAssignRoles: true, canViewActivityLog: true, canManageContent: true,
    canViewMentorDashboard: true, canModerate: true, canManagePrograms: true,
  },
}

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS['ADMIN']): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

export function isAdminRole(role: string): boolean {
  return ['ADMIN', 'MANAGER', 'EDITOR', 'MODERATOR', 'MENTOR'].includes(role)
}

export const ROLE_LABELS: Record<UserRole, { label: string; color: string; description: string }> = {
  USER: { label: 'User', color: 'bg-gray-100 text-gray-700', description: 'Standard user — can browse, save, and apply to scholarships' },
  EDITOR: { label: 'Editor', color: 'bg-yellow-100 text-yellow-700', description: 'Can create and edit content but cannot publish or delete' },
  MODERATOR: { label: 'Moderator', color: 'bg-orange-100 text-orange-700', description: 'Reviews submissions, manages contact and mentor applications' },
  MENTOR: { label: 'Mentor', color: 'bg-purple-100 text-purple-700', description: 'Access to mentor dashboard — guides and supports students' },
  MANAGER: { label: 'Manager', color: 'bg-blue-100 text-blue-700', description: 'Full content management and programs — cannot manage users or roles' },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700', description: 'Super admin — full access including users, roles, and activity logs' },
}
