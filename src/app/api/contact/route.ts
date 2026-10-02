export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuth } from '@/lib/auth'
import { sendMail } from '@/lib/mailer'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'

/**
 * Public contact form + signed-in "Speak with an advisor" requests.
 * Every message is stored in the Activity Log first (so nothing is lost if
 * email fails), then forwarded to the team inbox.
 */
const schema = z.object({
  kind: z.enum(['contact', 'advisor']).default('contact'),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(10, 'Please add a little more detail').max(5000),
  topic: z.string().trim().max(120).optional().default(''),
  stage: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().max(40).optional().default(''),
})

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function POST(req: NextRequest) {
  const limited = await rateLimitMiddleware('auth')(req)
  if (limited) return limited

  let parsed
  try {
    parsed = schema.safeParse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Please check the form' }, { status: 400 })
  }
  const data = parsed.data

  const session = await getAuth()
  if (data.kind === 'advisor' && !session) {
    return NextResponse.json({ error: 'Please sign in to book an advisor.' }, { status: 401 })
  }

  const action = data.kind === 'advisor' ? 'ADVISOR_REQUEST' : 'CONTACT_MESSAGE'
  const subject =
    data.kind === 'advisor'
      ? `Advisor request: ${data.topic || 'General'} - ${data.name}`
      : `Contact form: ${data.subject || 'New message'} - ${data.name}`

  try {
    await prisma.activityLog.create({
      data: {
        action,
        resource: 'contact',
        resourceName: subject.slice(0, 190),
        userId: session?.user?.id ?? null,
        userEmail: data.email,
        userRole: session?.user?.role ?? null,
        details: JSON.stringify(data),
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: req.headers.get('user-agent')?.slice(0, 250) ?? null,
      },
    })
  } catch (err) {
    console.error('[contact] failed to store message', err)
    return NextResponse.json({ error: 'Could not send your message. Please try again.' }, { status: 500 })
  }

  // Forward to the team inbox - best effort, the message is already stored
  const to = process.env.CONTACT_INBOX ?? process.env.ADMIN_EMAIL ?? 'hello@thexcel360.com'
  try {
    const rows = [
      ['Name', data.name],
      ['Email', data.email],
      ['Phone / WhatsApp', data.phone],
      ['Topic', data.topic],
      ['Stage', data.stage],
      ['Subject', data.subject],
    ].filter(([, v]) => v)
    await sendMail({
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0b1f3a">
        <h2 style="margin:0 0 12px">${esc(subject)}</h2>
        <table cellpadding="6" style="border-collapse:collapse">${rows
          .map(([k, v]) => `<tr><td style="color:#5f7798">${k}</td><td><strong>${esc(v)}</strong></td></tr>`)
          .join('')}</table>
        <p style="white-space:pre-wrap;margin-top:16px;line-height:1.6">${esc(data.message)}</p>
        <p style="color:#94a7c1;font-size:12px">Reply directly to ${esc(data.email)}. Also saved in Admin → Activity Log.</p>
      </div>`,
    })
  } catch (err) {
    console.error('[contact] email forward failed (message stored)', err)
  }

  if (data.kind === 'advisor' && session?.user?.id) {
    await prisma.notification
      .create({
        data: {
          userId: session.user.id,
          type: 'GENERAL',
          title: 'Advisor request received',
          message: 'Thanks! An Xcel360 advisor will reply by email within 2 working days.',
          link: '/dashboard/services/advisor',
        },
      })
      .catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
