import { NextRequest, NextResponse } from 'next/server'
import { resolvePoster } from '@/lib/poster/auth'
import { getPosterStats } from '@/lib/poster/create-opportunity'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  const auth = await resolvePoster(req, password)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  return NextResponse.json(await getPosterStats(auth.poster))
}
