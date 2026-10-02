export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'
import { createSecureResponse, handlePreflight } from '@/lib/security/headers'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'

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
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const programLevel = searchParams.get('programLevel') || ''
    const field = searchParams.get('field') || ''
    const country = searchParams.get('country') || ''
    const fundingType = searchParams.get('fundingType') || ''
    const sortBy = searchParams.get('sortBy') || 'deadline'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '12'), 50) // Max 50 per page

    // Validate page parameters
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return createSecureResponse({ error: 'Invalid pagination parameters' }, 400, req)
    }

    const where: any = liveOpportunityWhere()

    if (search) {
      // Sanitize search input
      const sanitizedSearch = search.replace(/[<>\"']/g, '').slice(0, 100)
      where.OR = [
        { title: { contains: sanitizedSearch, mode: 'insensitive' } },
        { hostOrg: { contains: sanitizedSearch, mode: 'insensitive' } },
        { country: { contains: sanitizedSearch, mode: 'insensitive' } },
        { fieldTags: { has: sanitizedSearch } },
      ]
    }
    if (programLevel) where.programLevel = { has: programLevel }
    if (field) where.field = field
    if (country) where.country = country
    if (fundingType) where.fundingType = fundingType

    const orderBy: any =
      sortBy === 'newest' ? { createdAt: 'desc' } :
      sortBy === 'featured' ? { featured: 'desc' } :
      { deadline: 'asc' }

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        // Only select necessary fields for public API
        select: {
          id: true,
          title: true,
          programLevel: true,
          field: true,
          fieldTags: true,
          country: true,
          region: true,
          hostOrg: true,
          fundingType: true,
          deadline: true,
          eligibility: true,
          requiredDocs: true,
          applicationLink: true,
          status: true,
          featured: true,
          description: true,
          views: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.opportunity.count({ where }),
    ])

    return createSecureResponse({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }, 200, req)
  } catch (error) {
    console.error('[OPPORTUNITIES GET ERROR]', error)
    return createSecureResponse({ error: 'Failed to fetch opportunities' }, 500, req)
  }
}
