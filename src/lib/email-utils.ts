import { createHmac } from 'crypto'
import prisma from '@/lib/prisma'

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

  // Fill gaps from EventRegistration (people who only registered for events)
  const missing = lower.filter(e => !map.has(e))
  if (missing.length) {
    const regs = await db.eventRegistration.findMany({
      where: { email: { in: missing } },
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
