export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'
import { createSecureResponse, handlePreflight } from '@/lib/security/headers'
import { getAuditLogs, AuditAction } from '@/lib/security/audit'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  userId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) || createSecureResponse({}, 200, req)
}

export async function GET(req: NextRequest) {
  // Handle CORS preflight
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware('api')(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await requireAdmin()

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const query = querySchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      userId: searchParams.get('userId'),
      action: searchParams.get('action'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    })

    const logs = await getAuditLogs({
      limit: query.limit,
      offset: query.offset,
      userId: query.userId,
      action: query.action as AuditAction,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    })

    return createSecureResponse({
      logs,
      pagination: {
        limit: query.limit,
        offset: query.offset,
      },
    }, 200, req)
  } catch (error: any) {
    console.error('[AUDIT LOGS ERROR]', error)
    
    if (error.message === 'Forbidden' || error.message === 'Unauthorized') {
      return createSecureResponse({ error: 'Forbidden' }, 403, req)
    }

    return createSecureResponse({ error: 'Failed to fetch audit logs' }, 500, req)
  }
}
