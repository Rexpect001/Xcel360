export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  return NextResponse.json({
    resendConfigured:     !!process.env.RESEND_API_KEY?.trim(),
    sendchampConfigured:  !!process.env.SENDCHAMP_API_KEY?.trim(),
    fromAddress:          process.env.EMAIL_FROM ?? '',
  })
}
