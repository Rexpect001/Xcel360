export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/security/email-verification'

// Simple in-memory rate limiter: max 5 requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  if (entry.count >= MAX_ATTEMPTS) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: 'If that email exists, a reset link has been sent.' },
        { status: 200 }
      )
    }

    const body = await req.json()
    const { email } = body

    if (email) {
      try {
        const token = await generatePasswordResetToken(email)
        if (token) {
          await sendPasswordResetEmail(email, token)
        }
      } catch (innerError) {
        console.error('[FORGOT PASSWORD ERROR]', innerError)
      }
    }

    // Always return success to avoid email enumeration
    return NextResponse.json(
      { message: 'If that email exists, a reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]', error)
    return NextResponse.json(
      { message: 'If that email exists, a reset link has been sent.' },
      { status: 200 }
    )
  }
}
