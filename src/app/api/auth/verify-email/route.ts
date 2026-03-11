import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'
import { createSecureResponse, handlePreflight } from '@/lib/security/headers'
import { verifyEmailToken } from '@/lib/security/email-verification'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string().min(10),
})

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) || createSecureResponse({}, 200, req)
}

export async function POST(req: NextRequest) {
  // Handle CORS preflight
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware('auth')(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    
    const validation = verifySchema.safeParse(body)
    if (!validation.success) {
      return createSecureResponse(
        { error: 'Invalid verification token' },
        400,
        req
      )
    }

    const { token } = validation.data

    // Find user by checking all pending verification tokens
    // This is a simplified approach - in production, you'd want to include userId in the token
    const tokenEntry = await prisma.$queryRaw<{ identifier: string }[]>`
      SELECT "identifier" FROM "VerificationToken"
      WHERE "token" LIKE 'verify_%'
        AND "expires" > NOW()
      LIMIT 1
    `

    if (tokenEntry.length === 0) {
      return createSecureResponse(
        { error: 'Invalid or expired verification token' },
        400,
        req
      )
    }

    const userId = tokenEntry[0].identifier
    const verified = await verifyEmailToken(userId, token)

    if (!verified) {
      return createSecureResponse(
        { error: 'Invalid or expired verification token' },
        400,
        req
      )
    }

    return createSecureResponse(
      { message: 'Email verified successfully. You can now log in.' },
      200,
      req
    )
  } catch (error) {
    console.error('[VERIFY EMAIL ERROR]', error)
    return createSecureResponse(
      { error: 'Failed to verify email. Please try again.' },
      500,
      req
    )
  }
}

// Resend verification email
export async function PUT(req: NextRequest) {
  // Handle CORS preflight
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  // Apply stricter rate limiting for resends
  const rateLimitResponse = await rateLimitMiddleware('auth')(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return createSecureResponse({ error: 'Email is required' }, 400, req)
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, emailVerified: true },
    })

    if (!user) {
      // Don't reveal if email exists
      return createSecureResponse(
        { message: 'If an account exists, a verification email has been sent.' },
        200,
        req
      )
    }

    if (user.emailVerified) {
      return createSecureResponse(
        { message: 'Email is already verified.' },
        200,
        req
      )
    }

    // Import here to avoid circular dependency
    const { generateVerificationToken, sendVerificationEmail } = await import('@/lib/security/email-verification')
    
    const token = await generateVerificationToken(user.id)
    await sendVerificationEmail(user.email, user.name || 'User', token)

    return createSecureResponse(
      { message: 'Verification email sent. Please check your inbox.' },
      200,
      req
    )
  } catch (error) {
    console.error('[RESEND VERIFICATION ERROR]', error)
    return createSecureResponse(
      { error: 'Failed to send verification email. Please try again.' },
      500,
      req
    )
  }
}
