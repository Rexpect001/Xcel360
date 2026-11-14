import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Record that the user saw the dashboard welcome/update pop-up, so it waits 30 days. */
export async function POST() {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.user.update({ where: { id: userId }, data: { welcomeSeenAt: new Date() } })
  return NextResponse.json({ ok: true })
}
