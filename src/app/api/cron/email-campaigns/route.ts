export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'
import {
  filterUnsubscribed,
  buildResendAttachments,
  injectUnsubscribeFooter,
  logEmailBatch,
  AttachmentMeta,
} from '@/lib/email-utils'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@xcel360.com>'
const BATCH_SIZE = 100

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 503 })

  const db = prisma as any
  const campaigns = await db.emailCampaign.findMany({ where: { status: 'SENDING' } })

  if (campaigns.length === 0) {
    return NextResponse.json({ message: 'No active campaigns', processed: 0 })
  }

  const resend = new Resend(apiKey)
  const results: { id: string; sent: number; status: string }[] = []

  for (const campaign of campaigns) {
    try {
      const allRecipients: string[] = JSON.parse(campaign.recipients ?? '[]')
      const unsent = allRecipients.slice(campaign.sentCount)

      if (unsent.length === 0) {
        await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'COMPLETED' } })
        results.push({ id: campaign.id, sent: 0, status: 'COMPLETED' })
        continue
      }

      // Filter unsubscribed
      const eligible = await filterUnsubscribed(unsent)
      const todayBatch = eligible.slice(0, campaign.dailyLimit)

      const cc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.ccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
      const bcc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.bccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
      const attachmentMetas: AttachmentMeta[] = (() => { try { return JSON.parse(campaign.attachments ?? '[]') } catch { return [] } })()
      const resendAttachments = await buildResendAttachments(attachmentMetas)

      let sent = 0
      for (let i = 0; i < todayBatch.length; i += BATCH_SIZE) {
        const chunk = todayBatch.slice(i, i + BATCH_SIZE)
        const { error } = await resend.batch.send(
          chunk.map((to: string) => ({
            from: FROM,
            to,
            subject: campaign.subject,
            html: injectUnsubscribeFooter(campaign.htmlBody, to),
            ...(cc ? { cc } : {}),
            ...(bcc ? { bcc } : {}),
            ...(resendAttachments ? { attachments: resendAttachments } : {}),
          }))
        )
        if (!error) {
          sent += chunk.length
          await logEmailBatch(campaign.id, chunk, 'SENT')
        } else {
          await logEmailBatch(campaign.id, chunk, 'FAILED', String(error))
        }
      }

      // Advance sentCount by the number of unsent we consumed (including unsubscribed — they're "processed")
      const processed = Math.min(campaign.dailyLimit, unsent.length)
      const newTotal = campaign.sentCount + processed
      const completed = newTotal >= allRecipients.length

      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { sentCount: newTotal, status: completed ? 'COMPLETED' : 'SENDING' },
      })

      results.push({ id: campaign.id, sent, status: completed ? 'COMPLETED' : 'SENDING' })
    } catch (err: any) {
      console.error(`[cron/email-campaigns] Campaign ${campaign.id} failed:`, err)
      await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'FAILED' } })
      results.push({ id: campaign.id, sent: 0, status: 'FAILED' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
