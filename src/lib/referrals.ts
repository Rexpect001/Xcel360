import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { grantCredits } from '@/lib/credits'
import { REFERRAL_CREDITS, REFERRAL_MAX_REWARDS } from '@/lib/billing'

/** Cookie that carries a referral code from /signup?ref=CODE through sign-up (incl. Google). */
export const REFERRAL_COOKIE = 'xcel_ref'

// No 0/O/1/I/L so codes are easy to read aloud
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function newCode(): string {
  const bytes = crypto.randomBytes(8)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function isReferralCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z2-9]{6,12}$/.test(value)
}

export function referralLink(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'
  return `${base}/signup?ref=${code}`
}

/** The user's invite code, created the first time it is needed. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } })
  if (user?.referralCode) return user.referralCode
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const code = newCode()
      // Only set it if still empty, so two tabs cannot give one user two codes
      const res = await prisma.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } })
      if (res.count === 1) return code
      const again = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } })
      if (again?.referralCode) return again.referralCode
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error
    }
  }
  throw new Error('Could not create a referral code')
}

export async function referralStats(userId: string) {
  const rewards = await prisma.creditEntry.count({ where: { userId, reason: 'REFERRAL', reference: { startsWith: 'referral-by:' } } })
  return { rewards, credits: rewards * REFERRAL_CREDITS, remaining: Math.max(0, REFERRAL_MAX_REWARDS - rewards) }
}

/**
 * Reward a new sign-up that came from a referral link: both people get
 * REFERRAL_CREDITS. Runs once per new user; ignores unknown codes, self-referral,
 * and referrers who have reached REFERRAL_MAX_REWARDS (the new user is still rewarded).
 */
export async function applyReferral(newUserId: string, code: unknown): Promise<'applied' | 'skipped'> {
  if (!isReferralCode(code)) return 'skipped'
  const referrer = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true, name: true, status: true } })
  if (!referrer || referrer.id === newUserId || referrer.status !== 'ACTIVE') return 'skipped'

  // Claim the link once: only a user with no referrer yet can be attributed
  const claimed = await prisma.user.updateMany({ where: { id: newUserId, referredById: null }, data: { referredById: referrer.id } })
  if (claimed.count !== 1) return 'skipped'

  const newUser = await prisma.user.findUnique({ where: { id: newUserId }, select: { name: true } })
  const referrerFirst = referrer.name?.split(' ')[0] || 'A friend'
  const newFirst = newUser?.name?.split(' ')[0] || 'A friend'

  await grantCredits({
    userId: newUserId,
    amount: REFERRAL_CREDITS,
    reference: `referral-new:${newUserId}`,
    reason: 'REFERRAL',
    note: `Joined with ${referrerFirst}'s invite`,
    message: `Welcome gift: you joined Xcel360 with ${referrerFirst}'s invite link.`,
  })

  const { remaining } = await referralStats(referrer.id)
  if (remaining > 0) {
    await grantCredits({
      userId: referrer.id,
      amount: REFERRAL_CREDITS,
      reference: `referral-by:${newUserId}`,
      reason: 'REFERRAL',
      note: `${newFirst} joined with your invite`,
      message: `${newFirst} joined Xcel360 with your invite link. Thank you for sharing!`,
    })
  }
  return 'applied'
}
