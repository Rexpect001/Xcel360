export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAdmin } from '@/lib/auth'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large. Maximum size is 5MB.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, WebP, or GIF images are allowed.' },
        { status: 400 }
      )
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 500 })
    }

    const blob = await put(`events/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type,
      token,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err: any) {
    console.error('[event flyer upload]', err)
    if (err?.message?.includes('Forbidden') || err?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: `Upload failed: ${err?.message ?? 'Unknown error'}` }, { status: 500 })
  }
}
