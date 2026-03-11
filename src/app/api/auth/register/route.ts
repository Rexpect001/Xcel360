import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { rateLimitMiddleware, trackFailedLogin } from '@/lib/security/rate-limiter'
import { registerSchema, validateInput } from '@/lib/security/validation'
import { createSecureResponse, handlePreflight } from '@/lib/security/headers'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/security/email-verification'

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

    // Validate input
    const validation = validateInput(registerSchema, body)
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

    const { name, email, password } = validation.data

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Track as failed attempt to prevent email enumeration attacks
      await trackFailedLogin(req)
      return createSecureResponse(
        { error: 'Registration failed. Please try again.' },
        409,
        req
      )
    }

    // Hash password with strong bcrypt rounds
    const hashed = await bcrypt.hash(password, 12)

    // Create user with unverified email
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true },
    })

    // Generate and send verification email
    try {
      const verificationToken = await generateVerificationToken(user.id)
      await sendVerificationEmail(user.email, user.name || 'User', verificationToken)
    } catch (emailError) {
      console.error('[EMAIL ERROR]', emailError)
      // Continue even if email fails - user can resend later
    }

    return createSecureResponse(
      { 
        ...user, 
        message: 'Registration successful. Please check your email to verify your account.'
      },
      201,
      req
    )
  } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return createSecureResponse(
      { error: 'Registration failed. Please try again later.' },
      500,
      req
    )
  }
}
