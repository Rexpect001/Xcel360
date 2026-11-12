import type { Session } from 'next-auth'
import { getBalance, hasUnlimitedCredits } from '@/lib/credits'

/** Balance for a page: null means unlimited (staff). Falls back to 0 if the lookup fails. */
export async function pageCredits(session: Session | null): Promise<number | null> {
  const userId = session?.user?.id
  if (!userId) return 0
  if (hasUnlimitedCredits(session.user.role)) return null
  return getBalance(userId).catch(() => 0)
}
