export const dynamic = 'force-dynamic'
import { ok, preflight, withUser } from '@/lib/mobile/http'
import { getOrCreateReferralCode, referralLink, referralStats } from '@/lib/referrals'
import { REFERRAL_CREDITS, REFERRAL_MAX_REWARDS } from '@/lib/billing'

export const OPTIONS = preflight

/** GET the student's invite code, link and how many friends have joined. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const code = await getOrCreateReferralCode(user.id)
    const stats = await referralStats(user.id)
    return ok({ code, link: referralLink(code), perFriend: REFERRAL_CREDITS, max: REFERRAL_MAX_REWARDS, ...stats })
  })
}
