import { NextRequest, NextResponse } from 'next/server'
import { resolvePoster } from '@/lib/poster/auth'
import { createOpportunityFromPoster } from '@/lib/poster/create-opportunity'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? 0) > 100_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { password, ...opportunity } = body
  const auth = await resolvePoster(req, password)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // Posters cannot feature listings or set an image URL - admins do that from /admin
  delete opportunity.featured
  delete opportunity.imageUrl

  const result = await createOpportunityFromPoster({ ...opportunity, postedBy: auth.poster })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json(result.data)
}
