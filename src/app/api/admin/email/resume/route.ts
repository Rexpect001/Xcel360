export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  filterUnsubscribed,
  buildFirstNameMap,
  sendBatch,
  AttachmentMeta,
} from '@/lib/email-utils'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@xcel360.com>'
function batchSize(provider: string, dailyLimit: number, total: number) {
  return provider === 'sendchamp' ? total : Math.min(dailyLimit, 100)
}

// POST — manually resume all SENDING campaigns (same logic as cron)
export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const campaigns = await db.emailCampaign.findMany({ where: { status: 'SENDING' } })
  if (campaigns.length === 0) return NextResponse.json({ message: 'No SENDING campaigns to resume', processed: 0 })

  const results: { id: string; sent: number; status: string }[] = []

  for (const campaign of campaigns) {
    try {
      const provider: string = campaign.provider ?? 'resend'

      const allRecipients: string[] = JSON.parse(campaign.recipients ?? '[]')
      const unsent = allRecipients.slice(campaign.sentCount)
      if (unsent.length === 0) {
        await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'COMPLETED' } })
        results.push({ id: campaign.id, sent: 0, status: 'COMPLETED' })
        continue
      }

      const eligible = await filterUnsubscribed(unsent)
      const todayBatch = eligible.slice(0, batchSize(provider, campaign.dailyLimit, eligible.length))

      const cc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.ccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
      const bcc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.bccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
      const attachmentMetas: AttachmentMeta[] = (() => { try { return JSON.parse(campaign.attachments ?? '[]') } catch { return [] } })()

      const firstNameMap = await buildFirstNameMap(todayBatch)
      const sent = await sendBatch({ provider, emails: todayBatch, subject: campaign.subject, htmlBody: campaign.htmlBody, textBody: campaign.textBody ?? undefined, firstNameMap, from: FROM, cc, bcc, attachmentMetas, campaignId: campaign.id })

      const processed = Math.min(campaign.dailyLimit, unsent.length)
      const newTotal = campaign.sentCount + processed
      const completed = newTotal >= allRecipients.length

      await db.emailCampaign.update({
        where: { id: campaign.id },
        data: { sentCount: newTotal, status: completed ? 'COMPLETED' : 'SENDING' },
      })
      results.push({ id: campaign.id, sent, status: completed ? 'COMPLETED' : 'SENDING' })
    } catch (err: any) {
      await db.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'FAILED' } })
      results.push({ id: campaign.id, sent: 0, status: 'FAILED' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
