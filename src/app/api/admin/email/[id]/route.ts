export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  filterUnsubscribed,
  buildFirstNameMap,
  logEmailBatch,
  sendBatch,
  AttachmentMeta,
} from '@/lib/email-utils'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@xcel360.com>'
const MAX_SEND_LIMIT = 100

// PATCH — send a DRAFT, cancel, or retry a FAILED campaign
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

  // Send (DRAFT → send first batch)
  if (action === 'send') {
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT campaigns can be sent' }, { status: 400 })
    }

    const provider: string = campaign.provider ?? 'resend'
    if (provider === 'resend' && !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })
    }
    if (provider === 'sendchamp' && !process.env.SENDCHAMP_API_KEY) {
      return NextResponse.json({ error: 'SENDCHAMP_API_KEY not configured' }, { status: 503 })
    }

    const allRecipients: string[] = JSON.parse(campaign.recipients ?? '[]')
    const eligible = await filterUnsubscribed(allRecipients)
    const firstBatch = eligible.slice(0, Math.min(campaign.dailyLimit, MAX_SEND_LIMIT))
    const cc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.ccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const bcc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.bccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const attachmentMetas: AttachmentMeta[] = (() => { try { return JSON.parse(campaign.attachments ?? '[]') } catch { return [] } })()

    const firstNameMap = await buildFirstNameMap(firstBatch)
    const sent = await sendBatch({ provider, emails: firstBatch, subject: campaign.subject, htmlBody: campaign.htmlBody, textBody: campaign.textBody ?? undefined, firstNameMap, from: FROM, cc, bcc, attachmentMetas, campaignId: campaign.id })

    const completed = sent >= allRecipients.length
    await db.emailCampaign.update({
      where: { id: params.id },
      data: { sentCount: sent, status: completed ? 'COMPLETED' : sent === 0 ? 'FAILED' : 'SENDING' },
    })
    return NextResponse.json({ ok: true, sent, total: allRecipients.length, remaining: allRecipients.length - sent, status: completed ? 'COMPLETED' : 'SENDING' })
  }

  // Retry (FAILED → restart from beginning)
  if (action === 'retry') {
    if (campaign.status !== 'FAILED') {
      return NextResponse.json({ error: 'Only FAILED campaigns can be retried' }, { status: 400 })
    }

    const provider: string = campaign.provider ?? 'resend'
    if (provider === 'resend' && !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })
    }
    if (provider === 'sendchamp' && !process.env.SENDCHAMP_API_KEY) {
      return NextResponse.json({ error: 'SENDCHAMP_API_KEY not configured' }, { status: 503 })
    }

    await db.emailCampaign.update({ where: { id: params.id }, data: { sentCount: 0, status: 'SENDING' } })

    const allRecipients: string[] = JSON.parse(campaign.recipients ?? '[]')
    const eligible = await filterUnsubscribed(allRecipients)
    const firstBatch = eligible.slice(0, Math.min(campaign.dailyLimit, MAX_SEND_LIMIT))
    const cc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.ccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const bcc: string[] | undefined = (() => { try { const v = JSON.parse(campaign.bccRecipients ?? '[]'); return v.length ? v : undefined } catch { return undefined } })()
    const attachmentMetas: AttachmentMeta[] = (() => { try { return JSON.parse(campaign.attachments ?? '[]') } catch { return [] } })()

    const firstNameMap = await buildFirstNameMap(firstBatch)
    const sent = await sendBatch({ provider, emails: firstBatch, subject: campaign.subject, htmlBody: campaign.htmlBody, textBody: campaign.textBody ?? undefined, firstNameMap, from: FROM, cc, bcc, attachmentMetas, campaignId: campaign.id })

    const completed = sent >= allRecipients.length
    await db.emailCampaign.update({ where: { id: params.id }, data: { sentCount: sent, status: completed ? 'COMPLETED' : sent === 0 ? 'FAILED' : 'SENDING' } })
    return NextResponse.json({ ok: true, sent, total: allRecipients.length, remaining: allRecipients.length - sent, status: completed ? 'COMPLETED' : 'SENDING' })
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
    db.emailLog.findMany({ where: { campaignId: params.id }, orderBy: { sentAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    db.emailLog.count({ where: { campaignId: params.id } }),
  ])
  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}

// DELETE — delete a campaign and its logs
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
