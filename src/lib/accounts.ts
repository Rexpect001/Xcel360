import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { applyReferral } from '@/lib/referrals'

/** Sign-up rules shared by the website and the mobile app. */
export const registerSchema = z.object({
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

export type RegisterInput = z.infer<typeof registerSchema>

export class AccountExistsError extends Error {
  constructor() {
    super('An account with this email already exists.')
  }
}

/**
 * Creates a credentials account (auto-verified, with an empty profile), applies a
 * referral code if one is given, and records the sign-up in the Activity Log.
 * Throws AccountExistsError when the email is taken (case-insensitive).
 */
export async function createAccount(input: RegisterInput, opts: { referral?: string | null; via?: 'web' | 'mobile' } = {}) {
  const existing = await prisma.user.findFirst({
    where: { email: { equals: input.email, mode: 'insensitive' } },
    select: { id: true },
  })
  if (existing) throw new AccountExistsError()

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await bcrypt.hash(input.password, 10),
      emailVerified: new Date(), // auto-verify - no email confirmation needed
      profile: { create: {} },
    },
    select: { id: true, email: true, name: true, role: true },
  })

  // Referral reward for both sides (never blocks sign-up)
  if (opts.referral) await applyReferral(user.id, opts.referral).catch((e) => console.error('[REGISTER] referral failed', e))

  prisma.activityLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      action: 'SIGNUP',
      resource: 'user',
      resourceId: user.id,
      resourceName: user.email,
      details: opts.via === 'mobile' ? 'New account created in the mobile app' : 'New account created via credentials',
    },
  }).catch(() => {})

  return user
}

let dummy: string | null = null
const dummyHash = () => (dummy ??= bcrypt.hashSync('not-a-real-password', 10))

export type CredentialCheck =
  | { ok: true; user: { id: string; email: string; name: string | null; role: string } }
  | { ok: false; error: string }

/**
 * Email + password check with the same rules as the website's sign-in:
 * case-insensitive email, prefer the duplicate that has a password, block
 * suspended and disabled accounts.
 */
export async function checkCredentials(email: string, password: string): Promise<CredentialCheck> {
  const candidates = await prisma.user.findMany({
    where: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
    select: { id: true, email: true, name: true, role: true, password: true, status: true },
  })
  const user = candidates.find((u) => u.password) ?? candidates[0] ?? null
  // Compare against a dummy hash when there is no user, so timing doesn't reveal which emails exist.
  const valid = await bcrypt.compare(password, user?.password ?? dummyHash())
  if (!user || !user.password || !valid) return { ok: false, error: 'Incorrect email or password.' }
  if (user.status === 'SUSPENDED') return { ok: false, error: 'Your account has been suspended. Please contact support.' }
  if (user.status === 'DISABLED') return { ok: false, error: 'Your account has been disabled. Please contact support.' }
  prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {})
  return { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
}
