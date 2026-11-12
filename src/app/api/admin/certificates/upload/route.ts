export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { putBlob } from '@/lib/blob-storage'
import { requireAdmin } from '@/lib/auth'

const MAX_SIZE = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

// Upload a certificate asset (background / logo / signature) to Azure Blob Storage.
// Form fields: file, kind ("background" | "logo" | "signature")
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const kind = (formData.get('kind') as string) || 'asset'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 8MB.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG or JPG images are allowed.' }, { status: 400 })
    }

    const safeKind = ['background', 'logo', 'signature'].includes(kind) ? kind : 'asset'
    const blob = await putBlob(`certificates/templates/${safeKind}-${Date.now()}-${file.name}`, file, {
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err: any) {
    console.error('[certificate asset upload]', err)
    if (err?.message?.includes('Forbidden') || err?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: `Upload failed: ${err?.message ?? 'Unknown error'}` }, { status: 500 })
  }
}
