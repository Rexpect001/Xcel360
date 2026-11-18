import { NextRequest, NextResponse } from 'next/server'
import { resolvePoster } from '@/lib/poster/auth'
import { getPosterStats } from '@/lib/poster/create-opportunity'

export const dynamic = 'force-dynamic'

// Unlock the poster page. With an empty body it checks whether the visitor is
// already signed in as staff (no password needed).
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  const auth = await resolvePoster(req, password)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const stats = await getPosterStats(auth.poster).catch(() => ({ poster: auth.poster, thisMonth: 0, allTime: 0 }))
  return NextResponse.json({ ok: true, via: auth.via, ...stats })
}
