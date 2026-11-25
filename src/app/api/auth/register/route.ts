export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { REFERRAL_COOKIE, applyReferral } from '@/lib/referrals'

const schema = z.object({
  name: z.string({ required_error: 'Please enter your name.' }).trim()
    .min(1, 'Please enter your name.')
    .max(100, 'Please keep your name under 100 characters.'),
  // Normalized so case/whitespace can't create duplicate accounts.
  email: z.string({ required_error: 'Please enter your email.' }).trim().toLowerCase()
    .email('Please enter a valid email address.')
    .max(200, 'That email address is too long.'),
  password: z.string({ required_error: 'Please choose a password.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(200, 'Password must be 200 characters or fewer.'),
})

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Please check the form.' }, { status: 400 })
  }
  const { name, email: normEmail, password } = parsed.data

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: normEmail, mode: 'insensitive' } },
    })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email: normEmail,
        password: hashed,
        emailVerified: new Date(), // auto-verify  -  no email confirmation needed
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true },
    })

    // Referral reward for both sides (never blocks sign-up)
    const ref = typeof body.ref === 'string' ? body.ref.trim().toUpperCase() : req.cookies.get(REFERRAL_COOKIE)?.value
    if (ref) await applyReferral(user.id, ref).catch((e) => console.error('[REGISTER] referral failed', e))

    // Log new registration to ActivityLog (non-blocking)
    prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'SIGNUP',
        resource: 'user',
        resourceId: user.id,
        resourceName: user.email,
        details: 'New account created via credentials',
      },
    }).catch(() => {})

    return NextResponse.json({ ...user, message: 'Account created successfully.' }, { status: 201 })
  } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
