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

// GET — campaigns list or email log
export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view')

  if (view === 'log') {
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = 100
    const [logs, total] = await Promise.all([
      db.emailLog.findMany({ orderBy: { sentAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      db.emailLog.count(),
    ])
    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
  }

  const campaigns = await db.emailCampaign.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(campaigns)
}

// POST — create and optionally send a campaign
export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const {
    subject, htmlBody, audience,
    dailyLimit = 100, sendAll = false,
    manualRecipients = [], ccRecipients = [], bccRecipients = [],
    attachments = [], isDraft = false,
  } = await req.json()

  if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  if (!htmlBody?.trim()) return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
  if (!audience) return NextResponse.json({ error: 'Audience is required' }, { status: 400 })

  const emails = new Set<string>()
  if (audience === 'users' || audience === 'both') {
    const users = await prisma.user.findMany({ select: { email: true } })
    users.forEach((u) => emails.add(u.email.toLowerCase().trim()))
  }
  if (audience === 'subscribers' || audience === 'both') {
    const subs = await (prisma as any).emailSubscriber.findMany({ select: { email: true } })
    subs.forEach((s: any) => emails.add(s.email.toLowerCase().trim()))
  }
  manualRecipients.forEach((e: string) => { const t = e.toLowerCase().trim(); if (t) emails.add(t) })

  const allRecipients = Array.from(emails)
  if (allRecipients.length === 0) return NextResponse.json({ error: 'No recipients found' }, { status: 400 })

  const db = prisma as any

  if (isDraft) {
    const campaign = await db.emailCampaign.create({
      data: {
        subject, htmlBody, audience,
        dailyLimit: Math.min(dailyLimit, MAX_SEND_LIMIT),
        recipients: JSON.stringify(allRecipients),
        manualRecipients: JSON.stringify(manualRecipients),
        ccRecipients: JSON.stringify(ccRecipients),
        bccRecipients: JSON.stringify(bccRecipients),
        attachments: JSON.stringify(attachments),
        totalCount: allRecipients.length,
        sentCount: 0,
        status: 'DRAFT',
      },
    })
    return NextResponse.json({ ok: true, campaignId: campaign.id, status: 'DRAFT', total: allRecipients.length })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

  // Filter unsubscribed before sending
  const eligible = await filterUnsubscribed(allRecipients)
  const limit = sendAll ? eligible.length : Math.min(dailyLimit, MAX_SEND_LIMIT)
  const firstBatch = eligible.slice(0, limit)

  const campaign = await db.emailCampaign.create({
    data: {
      subject, htmlBody, audience,
      dailyLimit: Math.min(dailyLimit, MAX_SEND_LIMIT),
      recipients: JSON.stringify(allRecipients),
      manualRecipients: JSON.stringify(manualRecipients),
      ccRecipients: JSON.stringify(ccRecipients),
      bccRecipients: JSON.stringify(bccRecipients),
      attachments: JSON.stringify(attachments),
      totalCount: allRecipients.length,
      sentCount: 0,
      status: 'SENDING',
    },
  })

  const resendAttachments = await buildResendAttachments(attachments as AttachmentMeta[])
  const cc = ccRecipients.length ? ccRecipients : undefined
  const bcc = bccRecipients.length ? bccRecipients : undefined
  const resend = new Resend(apiKey)
  let sent = 0

  for (let i = 0; i < firstBatch.length; i += BATCH_SIZE) {
    const chunk = firstBatch.slice(i, i + BATCH_SIZE)
    const { error } = await resend.batch.send(
      chunk.map((to: string) => ({
        from: FROM, to,
        subject,
        html: injectUnsubscribeFooter(htmlBody, to),
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
    where: { id: campaign.id },
    data: { sentCount: sent, status: completed ? 'COMPLETED' : sent === 0 ? 'FAILED' : 'SENDING' },
  })

  return NextResponse.json({
    ok: true, campaignId: campaign.id,
    total: allRecipients.length, sent,
    remaining: allRecipients.length - sent,
    status: completed ? 'COMPLETED' : 'SENDING',
  })
}
