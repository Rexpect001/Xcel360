import { NextRequest, NextResponse } from 'next/server'
import { resolvePoster } from '@/lib/poster/auth'
import { extractOpportunity, type PostType } from '@/lib/poster/extract'
import { findPossibleDuplicates } from '@/lib/poster/create-opportunity'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TYPES: PostType[] = ['SCHOLARSHIP', 'JOB', 'INTERNSHIP']
const MAX_BODY = 4_000_000 // ~3 MB image after base64; the page compresses to ~1024px JPEG first

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY) {
    return NextResponse.json({ error: 'Image too large' }, { status: 413 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const auth = await resolvePoster(req, body.password)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const postType: PostType = TYPES.includes(body.postType) ? body.postType : 'SCHOLARSHIP'
  const text = typeof body.text === 'string' ? body.text.slice(0, 20_000) : undefined
  const image =
    body.image && typeof body.image.data === 'string'
      ? { data: body.image.data as string, mediaType: String(body.image.mediaType ?? 'image/jpeg') }
      : undefined

  if (!text?.trim() && !image) {
    return NextResponse.json({ error: 'Add text or an image' }, { status: 400 })
  }

  const out = await extractOpportunity(postType, text, image)
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 502 })
  const r = out.result as Record<string, unknown>
  const duplicates = await findPossibleDuplicates(
    typeof r.title === 'string' ? r.title : '',
    typeof r.applicationLink === 'string' ? r.applicationLink.trim() : '',
  )
  return NextResponse.json({ ...r, duplicates })
}
