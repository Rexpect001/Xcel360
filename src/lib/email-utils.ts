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
