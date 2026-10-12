export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { Resend } from 'resend'
import { sendchampOne, parseFromString } from '@/lib/sendchamp'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@thexcel360.com>'

const TEST_BANNER = `<div style="background:#fef3c7;border:1px solid #f59e0b;padding:8px 12px;border-radius:6px;font-family:sans-serif;font-size:12px;margin-bottom:16px;color:#92400e;">
  ⚠️ This is a test email  -  not sent to your audience.
</div>`

export async function POST(req: NextRequest) {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { to, subject, htmlBody, textBody = '', provider = 'resend' } = await req.json()
  if (!to?.trim())      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 })
  if (!subject?.trim()) return NextResponse.json({ error: 'Subject required' }, { status: 400 })
  if (!htmlBody?.trim() && !textBody?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

  // ── SendChamp ──────────────────────────────────────────────────────────────
  if (provider === 'sendchamp') {
    if (!process.env.SENDCHAMP_API_KEY?.trim()) {
      return NextResponse.json({ error: 'SENDCHAMP_API_KEY not configured in environment' }, { status: 503 })
    }
    if (!textBody?.trim()) {
      return NextResponse.json({ error: 'Write the plain text body in the SendChamp text area before sending a test.' }, { status: 400 })
    }
    const from = parseFromString(FROM)
    const testText = `[TEST]\n\n${textBody}`
    const { ok, error } = await sendchampOne({ to: to.trim(), toName: to.split('@')[0], from, subject: `[TEST] ${subject}`, text: testText })
    if (!ok) return NextResponse.json({ error: `SendChamp error: ${error}` }, { status: 500 })
    return NextResponse.json({ ok: true, provider: 'sendchamp' })
  }

  // ── Resend (default) ───────────────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

  const html = `${TEST_BANNER}${htmlBody}`
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({ from: FROM, to: to.trim(), subject: `[TEST] ${subject}`, html })
  if (error) return NextResponse.json({ error: String(error) }, { status: 500 })
  return NextResponse.json({ ok: true, provider: 'resend' })
}
