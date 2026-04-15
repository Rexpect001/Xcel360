export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { put } from '@vercel/blob'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB — Resend attachment limit

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })

    const blob = await put(`email-attachments/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({
      filename: file.name,
      url: blob.url,
      contentType: file.type,
      size: file.size,
    })
  } catch (err: any) {
    console.error('[ATTACHMENT UPLOAD ERROR]', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
