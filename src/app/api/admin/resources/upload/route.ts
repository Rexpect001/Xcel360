export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { putBlob } from '@/lib/blob-storage'
import { requireAdmin } from '@/lib/auth'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Upload PDF, Word, Excel, PowerPoint, or text files.' },
        { status: 400 }
      )
    }

    // Upload to Azure Blob Storage
    const blob = await putBlob(`resources/${Date.now()}-${file.name}`, file, {
      contentType: file.type,
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (err: any) {
    console.error('[resource upload]', err)
    if (err?.message?.includes('Forbidden') || err?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: `Upload failed: ${err?.message ?? 'Unknown error'}` }, { status: 500 })
  }
}
