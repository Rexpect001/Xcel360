import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

export type AuditAction = 
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'USER_VERIFY_EMAIL'
  | 'OPPORTUNITY_CREATE'
  | 'OPPORTUNITY_UPDATE'
  | 'OPPORTUNITY_DELETE'
  | 'OPPORTUNITY_FEATURE'
  | 'OPPORTUNITY_LIST'
  | 'EVENT_CREATE'
  | 'EVENT_UPDATE'
  | 'EVENT_DELETE'
  | 'BLOG_CREATE'
  | 'BLOG_UPDATE'
  | 'BLOG_DELETE'
  | 'BLOG_PUBLISH'
  | 'MENTORSHIP_CREATE'
  | 'MENTORSHIP_UPDATE'
  | 'MENTORSHIP_DELETE'
  | 'PROGRAM_CREATE'
  | 'PROGRAM_UPDATE'
  | 'PROGRAM_DELETE'
  | 'RESOURCE_CREATE'
  | 'RESOURCE_UPDATE'
  | 'RESOURCE_DELETE'
  | 'SUCCESS_STORY_CREATE'
  | 'SUCCESS_STORY_UPDATE'
  | 'SUCCESS_STORY_DELETE'
  | 'BENEFICIARY_CREATE'
  | 'BENEFICIARY_UPDATE'
  | 'BENEFICIARY_DELETE'
  | 'ADMIN_PROMOTE'
  | 'ADMIN_DEMOTE'
  | 'SETTINGS_UPDATE'
  | 'EXPORT_DATA'

interface AuditLogEntry {
  action: AuditAction
  userId?: string
  userEmail?: string
  userRole?: Role
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
}

// Log an admin action
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    await db.activityLog.create({
      data: {
        userId: entry.userId ?? null,
        userEmail: entry.userEmail ?? null,
        userRole: entry.userRole ?? null,
        action: entry.action,
        resource: entry.targetType ?? null,
        resourceId: entry.targetId ?? null,
        details: entry.details
          ? JSON.stringify({ ...entry.details, success: entry.success, error: entry.errorMessage })
          : entry.errorMessage
          ? JSON.stringify({ success: entry.success, error: entry.errorMessage })
          : null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', {
        action: entry.action,
        user: entry.userEmail,
        target: `${entry.targetType}/${entry.targetId}`,
        success: entry.success,
      })
    }
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('[AUDIT ERROR]', error)
  }
}

// Helper to log with request context
export async function logAction(
  req: Request,
  action: AuditAction,
  options: {
    userId?: string
    userEmail?: string
    userRole?: Role
    targetType?: string
    targetId?: string
    details?: Record<string, unknown>
    success?: boolean
    errorMessage?: string
  } = {}
): Promise<void> {
  const headers = req.headers
  
  await logAdminAction({
    action,
    userId: options.userId,
    userEmail: options.userEmail,
    userRole: options.userRole,
    targetType: options.targetType,
    targetId: options.targetId,
    details: options.details,
    ipAddress: headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? undefined,
    userAgent: headers.get('user-agent') ?? undefined,
    success: options.success ?? true,
    errorMessage: options.errorMessage,
  })
}

// Get recent audit logs (admin only)
export async function getAuditLogs(options: {
  limit?: number
  offset?: number
  userId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
} = {}): Promise<AuditLogEntry[]> {
  const { limit = 50, offset = 0, userId, action, startDate, endDate } = options

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await db.activityLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => ({
      action: r.action as AuditAction,
      userId: r.userId ?? undefined,
      userEmail: r.userEmail ?? undefined,
      userRole: r.userRole ?? undefined,
      targetType: r.resource ?? undefined,
      targetId: r.resourceId ?? undefined,
      details: r.details ? JSON.parse(r.details) : undefined,
      ipAddress: r.ipAddress ?? undefined,
      userAgent: r.userAgent ?? undefined,
      success: true,
    }))
  } catch (error) {
    console.error('[AUDIT QUERY ERROR]', error)
    return []
  }
}

// No-op: ActivityLog table is managed by Prisma schema (was previously raw AuditLog table)
export async function initAuditLogTable(): Promise<void> {
  // Table already exists via prisma db push
}
