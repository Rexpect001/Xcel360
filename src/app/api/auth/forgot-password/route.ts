export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/security/email-verification'

// Simple in-memory rate limiter: max 5 requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

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
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    // Return generic message — don't reveal rate limiting to avoid abuse
    return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' }, { status: 200 })
  }

  const { email } = await req.json().catch(() => ({ email: null }))

  if (email) {
    try {
      const token = await generatePasswordResetToken(email)
      if (token) {
        await sendPasswordResetEmail(email, token)
        console.log(`[forgot-password] Reset email sent to ${email}`)
      } else {
        console.log(`[forgot-password] Email not found: ${email}`)
      }
    } catch (err) {
      // Log the real error on the server but never reveal it to the client
      console.error('[forgot-password] Failed to send reset email:', err)
    }
  }

  // Always return the same response — prevents email enumeration
  return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' }, { status: 200 })
}
