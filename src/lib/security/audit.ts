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
    // Store in database
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" (
        "id", "action", "userId", "userEmail", "userRole", 
        "targetType", "targetId", "details", "ipAddress", 
        "userAgent", "success", "errorMessage", "createdAt"
      ) VALUES (
        gen_random_uuid(), ${entry.action}, ${entry.userId ?? null}, 
        ${entry.userEmail ?? null}, ${entry.userRole ?? null}, 
        ${entry.targetType ?? null}, ${entry.targetId ?? null}, 
        ${entry.details ? JSON.stringify(entry.details) : null}, 
        ${entry.ipAddress ?? null}, ${entry.userAgent ?? null}, 
        ${entry.success}, ${entry.errorMessage ?? null}, NOW()
      )
    `
    
    // Also log to console in development
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
    const logs = await prisma.$queryRaw<AuditLogEntry[]>`
      SELECT * FROM "AuditLog"
      WHERE (${userId}::text IS NULL OR "userId" = ${userId})
        AND (${action}::text IS NULL OR "action" = ${action})
        AND (${startDate}::timestamp IS NULL OR "createdAt" >= ${startDate})
        AND (${endDate}::timestamp IS NULL OR "createdAt" <= ${endDate})
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    
    return logs
  } catch (error) {
    console.error('[AUDIT QUERY ERROR]', error)
    return []
  }
}

// Create audit log table if it doesn't exist
export async function initAuditLogTable(): Promise<void> {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY,
        "action" TEXT NOT NULL,
        "userId" TEXT,
        "userEmail" TEXT,
        "userRole" TEXT,
        "targetType" TEXT,
        "targetId" TEXT,
        "details" JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "success" BOOLEAN NOT NULL DEFAULT true,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `
    
    // Create indexes for common queries
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_audit_userId" ON "AuditLog"("userId")
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "AuditLog"("action")
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_audit_createdAt" ON "AuditLog"("createdAt")
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_audit_target" ON "AuditLog"("targetType", "targetId")
    `
  } catch (error) {
    console.error('[AUDIT INIT ERROR]', error)
  }
}
