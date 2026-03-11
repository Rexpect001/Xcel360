export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'
import { profileUpdateSchema, validateInput } from '@/lib/security/validation'
import { createSecureResponse, handlePreflight } from '@/lib/security/headers'

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

  const session = await getAuth()
  if (!session) {
    return createSecureResponse({ error: 'Unauthorized' }, 401, req)
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    return createSecureResponse(profile, 200, req)
  } catch (error) {
    console.error('[PROFILE GET ERROR]', error)
    return createSecureResponse({ error: 'Failed to fetch profile' }, 500, req)
  }
}

export async function PATCH(req: NextRequest) {
  // Handle CORS preflight
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware('api')(req)
  if (rateLimitResponse) return rateLimitResponse

  const session = await getAuth()
  if (!session) {
    return createSecureResponse({ error: 'Unauthorized' }, 401, req)
  }

  try {
    const body = await req.json()

    // Validate input
    const validation = validateInput(profileUpdateSchema, body)
    if (!validation.success) {
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

    const { level, targetCountries, targetFields, bio, whatsappNumber, school, department, notifyEmail, notifyInApp, reminderDays } = validation.data

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(level !== undefined && { level }),
        ...(targetCountries !== undefined && { targetCountries }),
        ...(targetFields !== undefined && { targetFields }),
        ...(bio !== undefined && { bio }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(school !== undefined && { school }),
        ...(department !== undefined && { department }),
        ...(notifyEmail !== undefined && { notifyEmail }),
        ...(notifyInApp !== undefined && { notifyInApp }),
        ...(reminderDays !== undefined && { reminderDays }),
      },
      create: {
        userId: session.user.id,
        level: level ?? null,
        targetCountries: targetCountries ?? [],
        targetFields: targetFields ?? [],
        bio: bio ?? null,
        whatsappNumber: whatsappNumber ?? null,
        school: school ?? null,
        department: department ?? null,
        notifyEmail: notifyEmail ?? true,
        notifyInApp: notifyInApp ?? true,
        reminderDays: reminderDays ?? [30, 14, 7, 2],
      },
    })

    return createSecureResponse(profile, 200, req)
  } catch (error) {
    console.error('[PROFILE PATCH ERROR]', error)
    return createSecureResponse({ error: 'Failed to update profile' }, 500, req)
  }
}
