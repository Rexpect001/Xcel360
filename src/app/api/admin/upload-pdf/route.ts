export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { put } from '@vercel/blob'

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File exceeds 20 MB limit' }, { status: 400 })

  const filename = `opportunities/pdfs/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
  const blob = await put(filename, file, { access: 'public', contentType: 'application/pdf' })
  return NextResponse.json({ url: blob.url })
}
