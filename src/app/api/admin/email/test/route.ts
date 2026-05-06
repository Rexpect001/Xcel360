export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@xcel360.com>'

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { to, subject, htmlBody } = await req.json()
  if (!to?.trim()) return NextResponse.json({ error: 'Recipient email required' }, { status: 400 })
  if (!subject?.trim()) return NextResponse.json({ error: 'Subject required' }, { status: 400 })
  if (!htmlBody?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: FROM,
    to: to.trim(),
    subject: `[TEST] ${subject}`,
    html: `<div style="background:#fef3c7;border:1px solid #f59e0b;padding:8px 12px;border-radius:6px;font-family:sans-serif;font-size:12px;margin-bottom:16px;color:#92400e;">
      ⚠️ This is a test email — not sent to your audience.
    </div>${htmlBody}`,
  })

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
