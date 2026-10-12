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

export function injectUnsubscribePlainFooter(text: string, email: string): string {
  return text + `\n\n────────────────────────────────────\nTo unsubscribe: ${unsubscribeUrl(email)}`
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

// ── Centralized, resumable campaign sender ─────────────────────────────────────
//
// The single source of truth for delivering a campaign. It walks `recipients`
// from a durable position cursor (campaign.sentCount), sending in chunks and
// persisting the cursor after EVERY chunk. If the serverless function times out
// mid-send, progress is saved  -  a later Resume or cron run continues exactly
// where it stopped, so no recipient is ever sent to twice and none are skipped.

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@thexcel360.com>'
const RESEND_CHUNK = 100
const SENDCHAMP_CHUNK = 10
const TIME_BUDGET_MS = 50_000 // stay safely under the 60s function limit

function parseJsonArr(v: string | null | undefined): string[] {
  try { const a = JSON.parse(v ?? '[]'); return Array.isArray(a) ? a : [] } catch { return [] }
}

export interface CampaignSendResult {
  sent: number; failed: number; cursor: number; total: number; completed: boolean; status: string
}

export async function runCampaignSend(campaignId: string, opts: { restart?: boolean } = {}): Promise<CampaignSendResult> {
  const db = prisma as any
  const started = Date.now()
  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } })
  if (!campaign) throw new Error('Campaign not found')

  const provider: string = campaign.provider ?? 'resend'
  if (provider === 'resend' && !process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')
  if (provider === 'sendchamp' && !process.env.SENDCHAMP_API_KEY?.trim()) throw new Error('SENDCHAMP_API_KEY not configured')
  if (provider === 'sendchamp' && !campaign.textBody?.trim()) throw new Error('Plain text body is required for SendChamp')

  const recipients: string[] = parseJsonArr(campaign.recipients)
  const total = recipients.length

  let start = campaign.sentCount ?? 0
  if (opts.restart) {
    start = 0
    await db.emailCampaign.update({ where: { id: campaignId }, data: { sentCount: 0, status: 'SENDING' } })
  } else if (campaign.status !== 'SENDING') {
    await db.emailCampaign.update({ where: { id: campaignId }, data: { status: 'SENDING' } })
  }

  // Resend free plan is limited per day; SendChamp processes as far as the time
  // budget allows this run (the loop also bails on the budget below).
  const cap = provider === 'resend' ? Math.min(campaign.dailyLimit ?? 100, 100) : total - start
  const end = Math.min(start + cap, total)
  const slice = recipients.slice(start, end)

  if (slice.length === 0) {
    await db.emailCampaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } })
    return { sent: 0, failed: 0, cursor: start, total, completed: true, status: 'COMPLETED' }
  }

  // Shared per-run data
  const unsubs = await db.emailUnsubscribe.findMany({ where: { email: { in: slice.map((e) => e.toLowerCase()) } }, select: { email: true } })
  const unsubSet = new Set(unsubs.map((u: any) => u.email.toLowerCase()))
  const firstNameMap = await buildFirstNameMap(slice)
  const cc = parseJsonArr(campaign.ccRecipients)
  const bcc = parseJsonArr(campaign.bccRecipients)
  const attachmentMetas = parseJsonArr(campaign.attachments) as unknown as AttachmentMeta[]
  const resendAttachments = provider === 'resend' ? await buildResendAttachments(attachmentMetas) : undefined
  const resend = provider === 'resend' ? new Resend(process.env.RESEND_API_KEY!) : null
  const scFrom = provider === 'sendchamp' ? parseFromString(FROM) : null
  const CHUNK = provider === 'sendchamp' ? SENDCHAMP_CHUNK : RESEND_CHUNK

  let sent = 0, failed = 0, cursor = start

  for (let i = 0; i < slice.length; i += CHUNK) {
    const chunkPos = slice.slice(i, i + CHUNK)
    const eligible = chunkPos.filter((e) => !unsubSet.has(e.toLowerCase()))

    if (eligible.length) {
      if (provider === 'resend') {
        const { error } = await resend!.batch.send(eligible.map((to) => ({
          from: FROM, to, subject: campaign.subject,
          html: injectUnsubscribeFooter(personalize(campaign.htmlBody, to, firstNameMap), to),
          ...(cc.length ? { cc } : {}), ...(bcc.length ? { bcc } : {}),
          ...(resendAttachments ? { attachments: resendAttachments } : {}),
        })))
        if (!error) { sent += eligible.length; await logEmailBatch(campaignId, eligible, 'SENT') }
        else { failed += eligible.length; await logEmailBatch(campaignId, eligible, 'FAILED', String(error)) }
      } else {
        const results = await Promise.allSettled(eligible.map(async (to) => {
          const text = injectUnsubscribePlainFooter(personalize(campaign.textBody, to, firstNameMap), to)
          const toName = firstNameMap.get(to.toLowerCase()) ?? 'Scholar'
          const { ok, error } = await sendchampOne({ to, toName, from: scFrom!, subject: campaign.subject, text })
          if (!ok) throw new Error(error)
          return to
        }))
        const okList = results.flatMap((r, idx) => r.status === 'fulfilled' ? [eligible[idx]] : [])
        const badList = results.flatMap((r, idx) => r.status === 'rejected' ? [eligible[idx]] : [])
        if (okList.length) { sent += okList.length; await logEmailBatch(campaignId, okList, 'SENT') }
        if (badList.length) { failed += badList.length; await logEmailBatch(campaignId, badList, 'FAILED', 'SendChamp delivery failed') }
      }
    }

    // Persist the cursor past this chunk (counting skipped unsubscribes) so a
    // crash/timeout never re-sends already-processed recipients.
    cursor = start + i + chunkPos.length
    await db.emailCampaign.update({ where: { id: campaignId }, data: { sentCount: cursor } })

    if (Date.now() - started > TIME_BUDGET_MS) break // pause; resume/cron picks up the rest
  }

  const completed = cursor >= total
  await db.emailCampaign.update({ where: { id: campaignId }, data: { status: completed ? 'COMPLETED' : 'SENDING' } })
  return { sent, failed, cursor, total, completed, status: completed ? 'COMPLETED' : 'SENDING' }
}
