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

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') ?? '100')))
    const skip = (page - 1) * limit

    const where: any = {}
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { hostOrg: { contains: search, mode: 'insensitive' } },
      ]
    }

    const db = prisma as any
    const [opportunities, total] = await Promise.all([
      db.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { savedBy: true, applications: true } },
        },
      }),
      db.opportunity.count({ where }),
    ])

    return createSecureResponse(
      { data: opportunities, total, page, pages: Math.ceil(total / limit) },
      200,
      req
    )
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

    const deadlineDate = data.deadline ? new Date(data.deadline) : null

    // Check for duplicate: same title (skip deadline check if null)
    const db2 = prisma as any
    const existing = await db2.opportunity.findFirst({
      where: {
        title: { equals: data.title.trim(), mode: 'insensitive' },
        ...(deadlineDate ? { deadline: deadlineDate } : {}),
      },
      select: { id: true },
    })
    if (existing) {
      return createSecureResponse(
        { error: 'A posting with this title and deadline already exists. Please use a different title or deadline.' },
        409,
        req
      )
    }

    const db = prisma as any
    const opp = await db.opportunity.create({
      data: {
        ...data,
        deadline: deadlineDate,
        skills: data.skills ?? [],
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
