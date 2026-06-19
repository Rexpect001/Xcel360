import { createHmac } from 'crypto'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { sendchampOne, parseFromString } from '@/lib/sendchamp'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

// ── Unsubscribe token ─────────────────────────────────────────────────────────

export function unsubscribeToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? 'fallback-secret'
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex')
}

export function unsubscribeUrl(email: string): string {
  return `${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken(email)}`
}

export function injectUnsubscribeFooter(html: string, email: string): string {
  const footer = `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:12px;color:#9ca3af;text-align:center;">
  You're receiving this because you signed up at Xcel360.&nbsp;
  <a href="${unsubscribeUrl(email)}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
</div>`
  return html.includes('</body>')
    ? html.replace('</body>', `${footer}</body>`)
    : html + footer
}

// ── First-name personalisation ───────────────────────────────────────────────

/**
 * Builds a map of email → firstName for a list of recipient addresses.
 * Checks User table first, then EventRegistration as a fallback for
 * people who registered for events but never created a full account.
 * Falls back to "Scholar" when no name can be found.
 */
export async function buildFirstNameMap(emails: string[]): Promise<Map<string, string>> {
  const db = prisma as any
  const lower = emails.map(e => e.toLowerCase())
  const map = new Map<string, string>()

  // Pull from User table
  const users = await prisma.user.findMany({
    where: { email: { in: lower } },
    select: { email: true, name: true },
  })
  for (const u of users) {
    if (u.name) map.set(u.email.toLowerCase(), u.name.trim().split(/\s+/)[0])
  }

  // Fill gaps from Contacts master list
  const missing1 = lower.filter(e => !map.has(e))
  if (missing1.length) {
    const contacts = await db.contact.findMany({
      where: { email: { in: missing1 } },
      select: { email: true, name: true },
    })
    for (const c of contacts) {
      if (c.name && !map.has(c.email)) {
        map.set(c.email, c.name.trim().split(/\s+/)[0])
      }
    }
  }

  // Fill remaining gaps from EventRegistration
  const missing2 = lower.filter(e => !map.has(e))
  if (missing2.length) {
    const regs = await db.eventRegistration.findMany({
      where: { email: { in: missing2 } },
      select: { email: true, fullName: true },
      distinct: ['email'],
    })
    for (const r of regs) {
      if (r.fullName && !map.has(r.email.toLowerCase())) {
        map.set(r.email.toLowerCase(), r.fullName.trim().split(/\s+/)[0])
      }
    }
  }

  return map
}

/** Replace [First Name] in htmlBody with the recipient's actual first name. */
export function personalize(html: string, email: string, firstNameMap: Map<string, string>): string {
  const name = firstNameMap.get(email.toLowerCase()) ?? 'Scholar'
  return html.replace(/\[First Name\]/gi, name)
}

// ── Unsubscribe check ────────────────────────────────────────────────────────

export async function filterUnsubscribed(emails: string[]): Promise<string[]> {
  const db = prisma as any
  const unsubs = await db.emailUnsubscribe.findMany({
    where: { email: { in: emails.map(e => e.toLowerCase()) } },
    select: { email: true },
  })
  const set = new Set(unsubs.map((u: any) => u.email))
  return emails.filter(e => !set.has(e.toLowerCase()))
}

// ── Attachment fetching ──────────────────────────────────────────────────────

export type AttachmentMeta = { filename: string; url: string; contentType: string; size: number }

export async function buildResendAttachments(attachments: AttachmentMeta[]) {
  if (!attachments.length) return undefined
  return Promise.all(
    attachments.map(async (a) => {
      const res = await fetch(a.url)
      const buf = await res.arrayBuffer()
      return { filename: a.filename, content: Buffer.from(buf).toString('base64') }
    })
  )
}

// ── Per-recipient log ────────────────────────────────────────────────────────

export async function logEmailBatch(
  campaignId: string,
  recipients: string[],
  status: 'SENT' | 'FAILED',
  error?: string
) {
  const db = prisma as any
  await db.emailLog.createMany({
    data: recipients.map(to => ({ campaignId, to, status, error: error ?? null })),
    skipDuplicates: true,
  })
}

// ── Unified sendBatch ─────────────────────────────────────────────────────────

export interface SendBatchOpts {
  provider: string           // 'resend' | 'sendchamp'
  emails: string[]           // pre-filtered, unsubscribes removed
  subject: string
  htmlBody: string
  firstNameMap: Map<string, string>
  from: string               // "Xcel360 <noreply@xcel360.com>"
  cc?: string[]
  bcc?: string[]
  attachmentMetas?: AttachmentMeta[]
  campaignId: string
}

const RESEND_CHUNK = 100
const SENDCHAMP_CHUNK = 10  // SendChamp: small parallel batches to stay within rate limits

export async function sendBatch(opts: SendBatchOpts): Promise<number> {
  return opts.provider === 'sendchamp'
    ? _sendViaSendchamp(opts)
    : _sendViaResend(opts)
}

async function _sendViaResend(opts: SendBatchOpts): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')

  const resend = new Resend(apiKey)
  const resendAttachments = await buildResendAttachments(opts.attachmentMetas ?? [])
  let sent = 0

  for (let i = 0; i < opts.emails.length; i += RESEND_CHUNK) {
    const chunk = opts.emails.slice(i, i + RESEND_CHUNK)
    const { error } = await resend.batch.send(
      chunk.map((to) => ({
        from: opts.from,
        to,
        subject: opts.subject,
        html: injectUnsubscribeFooter(personalize(opts.htmlBody, to, opts.firstNameMap), to),
        ...(opts.cc?.length ? { cc: opts.cc } : {}),
        ...(opts.bcc?.length ? { bcc: opts.bcc } : {}),
        ...(resendAttachments ? { attachments: resendAttachments } : {}),
      }))
    )
    if (!error) { sent += chunk.length; await logEmailBatch(opts.campaignId, chunk, 'SENT') }
    else { await logEmailBatch(opts.campaignId, chunk, 'FAILED', String(error)) }
  }

  return sent
}

async function _sendViaSendchamp(opts: SendBatchOpts): Promise<number> {
  if (!process.env.SENDCHAMP_API_KEY?.trim()) throw new Error('SENDCHAMP_API_KEY not configured')

  const from = parseFromString(opts.from)
  let sent = 0

  for (let i = 0; i < opts.emails.length; i += SENDCHAMP_CHUNK) {
    const chunk = opts.emails.slice(i, i + SENDCHAMP_CHUNK)
    const results = await Promise.allSettled(
      chunk.map(async (to) => {
        const html = injectUnsubscribeFooter(personalize(opts.htmlBody, to, opts.firstNameMap), to)
        const toName = opts.firstNameMap.get(to.toLowerCase()) ?? 'Scholar'
        const { ok, error } = await sendchampOne({ to, toName, from, subject: opts.subject, html })
        if (!ok) throw new Error(error)
        return to
      })
    )
    const succeeded = results.flatMap((r, idx) => r.status === 'fulfilled' ? [chunk[idx]] : [])
    const failed    = results.flatMap((r, idx) => r.status === 'rejected'  ? [chunk[idx]] : [])
    if (succeeded.length) { sent += succeeded.length; await logEmailBatch(opts.campaignId, succeeded, 'SENT') }
    if (failed.length)    await logEmailBatch(opts.campaignId, failed, 'FAILED', 'SendChamp delivery failed')
  }

  return sent
}
