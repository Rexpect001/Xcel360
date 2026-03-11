export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notifyMatchingUsers } from '@/lib/notifications'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'
import { opportunitySchema, validateInput } from '@/lib/security/validation'
import { createSecureResponse, handlePreflight } from '@/lib/security/headers'
import { logAction } from '@/lib/security/audit'

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

    // Log admin action
    await logAction(req, 'OPPORTUNITY_LIST', {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: 'ADMIN',
      success: true,
    })

    const opportunities = await prisma.opportunity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { savedBy: true, applications: true } },
      },
    })

    return createSecureResponse(opportunities, 200, req)
  } catch {
    return createSecureResponse({ error: 'Forbidden' }, 403, req)
  }
}

export async function POST(req: NextRequest) {
  // Handle CORS preflight
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware('api')(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const session = await requireAdmin()

    const body = await req.json()

    // Validate input
    const validation = validateInput(opportunitySchema, body)
    if (!validation.success) {
      await logAction(req, 'OPPORTUNITY_CREATE', {
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: 'ADMIN',
        success: false,
        errorMessage: 'Validation failed',
      })

      return createSecureResponse(
        { 
          error: 'Validation failed', 
          details: validation.errors.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        400,
        req
      )
    }

    const data = validation.data

    // Convert deadline string to Date
    const deadlineDate = new Date(data.deadline)
    
    // Check if deadline is in the past
    if (deadlineDate < new Date()) {
      return createSecureResponse(
        { error: 'Deadline cannot be in the past' },
        400,
        req
      )
    }

    const opp = await prisma.opportunity.create({
      data: {
        ...data,
        deadline: deadlineDate,
      },
    })

    // Log successful creation
    await logAction(req, 'OPPORTUNITY_CREATE', {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: 'ADMIN',
      targetType: 'Opportunity',
      targetId: opp.id,
      details: { title: opp.title },
      success: true,
    })

    // Notify matching users (non-blocking)
    notifyMatchingUsers(opp.id).catch(console.error)

    return createSecureResponse(opp, 201, req)
  } catch (error: any) {
    console.error('[ADMIN OPPORTUNITY CREATE ERROR]', error)
    
    // Log failure
    await logAction(req, 'OPPORTUNITY_CREATE', {
      success: false,
      errorMessage: error.message,
    })

    return createSecureResponse({ error: 'Failed to create opportunity' }, 400, req)
  }
}
