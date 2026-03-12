import prisma from '@/lib/prisma'

export type LogAction =
  | 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'SIGNUP'
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH'
  | 'ASSIGN_ROLE' | 'SAVE_OPPORTUNITY' | 'APPLY' | 'VIEW'
  | 'DOWNLOAD' | 'CONTACT_FORM' | 'MENTOR_APPLICATION'

interface LogParams {
  userId?: string
  userEmail?: string
  userRole?: string
  action: LogAction
  resource?: string
  resourceId?: string
  resourceName?: string
  details?: string
  req?: Request
}

export async function logActivity(params: LogParams) {
  try {
    const ip = params.req
      ? (params.req.headers.get('x-forwarded-for') ?? params.req.headers.get('x-real-ip') ?? 'unknown')
      : undefined
    const userAgent = params.req ? (params.req.headers.get('user-agent') ?? undefined) : undefined

    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        userRole: params.userRole,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        details: params.details,
        ipAddress: ip,
        userAgent: userAgent,
      },
    })
  } catch (e) {
    // Never let logging break the main flow
    console.error('[ACTIVITY LOG ERROR]', e)
  }
}
