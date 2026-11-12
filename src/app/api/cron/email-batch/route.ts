export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <onboarding@resend.dev>'

/**
 * Daily cron  -  continues any campaigns that still have unsent recipients.
 * Called by an external scheduler. Protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

  const db = prisma as any
  const activeCampaigns = await db.emailCampaign.findMany({
    where: { status: 'SENDING' },
  })

  if (activeCampaigns.length === 0) {
    return NextResponse.json({ ok: true, message: 'No active campaigns' })
  }

  const resend = new Resend(apiKey)
  const results = []

  for (const campaign of activeCampaigns) {
    let recipients: string[] = []
    try {
      recipients = JSON.parse(campaign.recipients)
    } catch {
      await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'FAILED' } })
      continue
    }

    const remaining = recipients.slice(campaign.sentCount)
    if (remaining.length === 0) {
      await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'COMPLETED' } })
      continue
    }

    // Parse CC, BCC, and attachment metadata stored on the campaign
    let ccRecipients: string[] = []
    let bccRecipients: string[] = []
    let attachmentMeta: Array<{ filename: string; url: string }> = []
    try { ccRecipients = JSON.parse(campaign.ccRecipients ?? '[]') } catch { /* ignore */ }
    try { bccRecipients = JSON.parse(campaign.bccRecipients ?? '[]') } catch { /* ignore */ }
    try { attachmentMeta = JSON.parse(campaign.attachments ?? '[]') } catch { /* ignore */ }

    // Fetch attachment content fresh (Resend requires base64 inline)
    let resendAttachments: Array<{ filename: string; content: string }> | undefined
    if (attachmentMeta.length > 0) {
      try {
        resendAttachments = await Promise.all(
          attachmentMeta.map(async (a) => {
            const res = await fetch(a.url)
            const buf = await res.arrayBuffer()
            return { filename: a.filename, content: Buffer.from(buf).toString('base64') }
          })
        )
      } catch {
        resendAttachments = undefined
      }
    }

    const cc = ccRecipients.length ? ccRecipients : undefined
    const bcc = bccRecipients.length ? bccRecipients : undefined
    const batch = remaining.slice(0, campaign.dailyLimit)
    let sent = 0

    const CHUNK = 100
    for (let i = 0; i < batch.length; i += CHUNK) {
      const chunk = batch.slice(i, i + CHUNK)
      const { error } = await resend.batch.send(
        chunk.map((to: string) => ({
          from: FROM,
          to,
          subject: campaign.subject,
          html: campaign.htmlBody,
          ...(cc ? { cc } : {}),
          ...(bcc ? { bcc } : {}),
          ...(resendAttachments ? { attachments: resendAttachments } : {}),
        }))
      )
      if (!error) sent += chunk.length
    }

    const newSentCount = campaign.sentCount + sent
    const completed = newSentCount >= recipients.length

    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        sentCount: newSentCount,
        status: completed ? 'COMPLETED' : 'SENDING',
      },
    })

    results.push({
      id: campaign.id,
      subject: campaign.subject,
      sent,
      remaining: recipients.length - newSentCount,
    })
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
