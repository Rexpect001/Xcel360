export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
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
const MAX_SEND_LIMIT = 100

// PATCH — resume a DRAFT or cancel a SENDING campaign
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { action } = await req.json()
  const db = prisma as any
  const campaign = await db.emailCampaign.findUnique({ where: { id: params.id } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Cancel
  if (action === 'cancel') {
    if (!['SENDING', 'DRAFT'].includes(campaign.status)) {
      return NextResponse.json({ error: 'Only SENDING or DRAFT campaigns can be cancelled' }, { status: 400 })
    }
    await db.emailCampaign.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ ok: true, status: 'CANCELLED' })
  }

  // Resume (send draft)
  if (action === 'send') {
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT campaigns can be sent' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

    const allRecipients: string[] = JSON.parse(campaign.recipients ?? '[]')
    const eligible = await filterUnsubscribed(allRecipients)
    const firstBatch = eligible.slice(0, Math.min(campaign.dailyLimit, MAX_SEND_LIMIT))

    const cc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.ccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const bcc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.bccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const attachmentMetas: AttachmentMeta[] = (() => { try { return JSON.parse(campaign.attachments ?? '[]') } catch { return [] } })()
    const resendAttachments = await buildResendAttachments(attachmentMetas)

    const resend = new Resend(apiKey)
    let sent = 0

    for (let i = 0; i < firstBatch.length; i += BATCH_SIZE) {
      const chunk = firstBatch.slice(i, i + BATCH_SIZE)
      const { error } = await resend.batch.send(
        chunk.map((to: string) => ({
          from: FROM, to,
          subject: campaign.subject,
          html: injectUnsubscribeFooter(campaign.htmlBody, to),
          ...(cc ? { cc } : {}),
          ...(bcc ? { bcc } : {}),
          ...(resendAttachments ? { attachments: resendAttachments } : {}),
        }))
      )
      if (!error) { sent += chunk.length; await logEmailBatch(campaign.id, chunk, 'SENT') }
      else { await logEmailBatch(campaign.id, chunk, 'FAILED', String(error)) }
    }

    const completed = sent >= allRecipients.length
    await db.emailCampaign.update({
      where: { id: params.id },
      data: { sentCount: sent, status: completed ? 'COMPLETED' : sent === 0 ? 'FAILED' : 'SENDING' },
    })

    return NextResponse.json({
      ok: true, sent, total: allRecipients.length,
      remaining: allRecipients.length - sent,
      status: completed ? 'COMPLETED' : 'SENDING',
    })
  }

  // Retry (re-send a FAILED campaign from scratch)
  if (action === 'retry') {
    if (campaign.status !== 'FAILED') {
      return NextResponse.json({ error: 'Only FAILED campaigns can be retried' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

    await db.emailCampaign.update({ where: { id: params.id }, data: { sentCount: 0, status: 'SENDING' } })

    const allRecipients: string[] = JSON.parse(campaign.recipients ?? '[]')
    const eligible = await filterUnsubscribed(allRecipients)
    const firstBatch = eligible.slice(0, Math.min(campaign.dailyLimit, MAX_SEND_LIMIT))

    const cc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.ccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const bcc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.bccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const attachmentMetas: AttachmentMeta[] = (() => { try { return JSON.parse(campaign.attachments ?? '[]') } catch { return [] } })()
    const resendAttachments = await buildResendAttachments(attachmentMetas)

    const resend = new Resend(apiKey)
    let sent = 0

    for (let i = 0; i < firstBatch.length; i += BATCH_SIZE) {
      const chunk = firstBatch.slice(i, i + BATCH_SIZE)
      const { error } = await resend.batch.send(
        chunk.map((to: string) => ({
          from: FROM, to,
          subject: campaign.subject,
          html: injectUnsubscribeFooter(campaign.htmlBody, to),
          ...(cc ? { cc } : {}),
          ...(bcc ? { bcc } : {}),
          ...(resendAttachments ? { attachments: resendAttachments } : {}),
        }))
      )
      if (!error) { sent += chunk.length; await logEmailBatch(campaign.id, chunk, 'SENT') }
      else { await logEmailBatch(campaign.id, chunk, 'FAILED', String(error)) }
    }

    const completed = sent >= allRecipients.length
    await db.emailCampaign.update({
      where: { id: params.id },
      data: { sentCount: sent, status: completed ? 'COMPLETED' : sent === 0 ? 'FAILED' : 'SENDING' },
    })

    return NextResponse.json({
      ok: true, sent, total: allRecipients.length,
      remaining: allRecipients.length - sent,
      status: completed ? 'COMPLETED' : 'SENDING',
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// GET — fetch logs for a specific campaign
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 100

  const [logs, total] = await Promise.all([
    db.emailLog.findMany({
      where: { campaignId: params.id },
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.emailLog.count({ where: { campaignId: params.id } }),
  ])

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}

// DELETE — delete a DRAFT or COMPLETED/FAILED/CANCELLED campaign
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const campaign = await db.emailCampaign.findUnique({ where: { id: params.id } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (campaign.status === 'SENDING') {
    return NextResponse.json({ error: 'Cancel the campaign before deleting' }, { status: 400 })
  }

  await db.emailLog.deleteMany({ where: { campaignId: params.id } })
  await db.emailCampaign.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
