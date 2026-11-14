import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { getBalance, hasUnlimitedCredits } from '@/lib/credits'

export const dynamic = 'force-dynamic'

/** The signed-in user's credit balance, for the sidebar. `credits: null` means unlimited (staff). */
export async function GET() {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (hasUnlimitedCredits(session.user.role)) return NextResponse.json({ credits: null })
  try {
    return NextResponse.json({ credits: await getBalance(userId) })
  } catch {
    return NextResponse.json({ error: 'Balance unavailable' }, { status: 503 })
  }
}
