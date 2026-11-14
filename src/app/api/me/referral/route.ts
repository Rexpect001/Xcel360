import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { getOrCreateReferralCode, referralLink, referralStats } from '@/lib/referrals'
import { REFERRAL_CREDITS, REFERRAL_MAX_REWARDS } from '@/lib/billing'

export const dynamic = 'force-dynamic'

/** The signed-in user's invite link and how many rewards they have earned. */
export async function GET() {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const code = await getOrCreateReferralCode(userId)
    const stats = await referralStats(userId)
    return NextResponse.json({ code, link: referralLink(code), reward: REFERRAL_CREDITS, max: REFERRAL_MAX_REWARDS, ...stats })
  } catch (error) {
    console.error('[me/referral]', error)
    return NextResponse.json({ error: 'Invite links are not available right now.' }, { status: 503 })
  }
}
