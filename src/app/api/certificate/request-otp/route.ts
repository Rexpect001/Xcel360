export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendCertificateOtpEmail } from '@/lib/certificates/email'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const THROTTLE_MS = 60 * 1000 // one code per email per minute

// Send a one-time access code to a participant's email — only if they have
// at least one issued certificate. Always returns a generic response so the
// endpoint never reveals whether an email exists.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const clean = String(email ?? '').trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clean)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    const hasCerts = await db.certificate.count({
      where: { email: clean, status: 'ISSUED' },
    })

    const generic = NextResponse.json({
      ok: true,
      message: 'If certificates exist for this email, a verification code has been sent.',
    })

    if (!hasCerts) return generic

    // Throttle: skip if a code was sent in the last minute
    const recent = await db.certificateOtp.findFirst({
      where: { email: clean, createdAt: { gt: new Date(Date.now() - THROTTLE_MS) } },
      orderBy: { createdAt: 'desc' },
    })
    if (recent) return generic

    const code = String(Math.floor(100000 + Math.random() * 900000))
    await db.certificateOtp.create({
      data: { email: clean, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    })

    try {
      await sendCertificateOtpEmail({ to: clean, code })
    } catch (e) {
      console.error('[otp email]', e)
    }

    return generic
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
