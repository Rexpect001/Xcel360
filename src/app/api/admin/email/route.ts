export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <onboarding@resend.dev>'

type AttachmentMeta = { filename: string; url: string; contentType: string; size: number }

async function buildResendAttachments(attachments: AttachmentMeta[]) {
  if (!attachments.length) return undefined
  return Promise.all(
    attachments.map(async (a) => {
      const res = await fetch(a.url)
      const buf = await res.arrayBuffer()
      return { filename: a.filename, content: Buffer.from(buf).toString('base64') }
    })
  )
}

// GET — list all campaigns
export async function GET() {
  try {
    await requireAdmin()
    const db = prisma as any
    const campaigns = await db.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(campaigns)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// POST — create and optionally start sending a campaign
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const {
      subject,
      htmlBody,
      audience,
      dailyLimit = 100,
      sendAll = false,
      manualRecipients = [],
      ccRecipients = [],
      bccRecipients = [],
      attachments = [],
      isDraft = false,
    } = await req.json()

    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    if (!htmlBody?.trim()) return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
    if (!audience) return NextResponse.json({ error: 'Audience is required' }, { status: 400 })

    // Build recipient list
    const emails = new Set<string>()

    if (audience === 'users' || audience === 'both') {
      const users = await prisma.user.findMany({ select: { email: true } })
      users.forEach((u) => emails.add(u.email.toLowerCase().trim()))
    }

    if (audience === 'subscribers' || audience === 'both') {
      const subs = await (prisma as any).emailSubscriber.findMany({ select: { email: true } })
      subs.forEach((s: any) => emails.add(s.email.toLowerCase().trim()))
    }

    // Merge manual recipients
    manualRecipients.forEach((e: string) => {
      const trimmed = e.toLowerCase().trim()
      if (trimmed) emails.add(trimmed)
    })

    const allRecipients = Array.from(emails)

    if (allRecipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    const db = prisma as any

    // Save as draft — no sending
    if (isDraft) {
      const campaign = await db.emailCampaign.create({
        data: {
          subject,
          htmlBody,
          audience,
          dailyLimit: Math.min(dailyLimit, 100),
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

    const limit = sendAll ? allRecipients.length : Math.min(dailyLimit, 100)
    const firstBatch = allRecipients.slice(0, limit)

    // Create campaign record
    const campaign = await db.emailCampaign.create({
      data: {
        subject,
        htmlBody,
        audience,
        dailyLimit: Math.min(dailyLimit, 100),
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

    // Fetch attachment content once for the entire campaign
    const resendAttachments = await buildResendAttachments(attachments)
    const cc = ccRecipients.length ? ccRecipients : undefined
    const bcc = bccRecipients.length ? bccRecipients : undefined

    // Send first batch (max 100 per Resend call)
    const resend = new Resend(apiKey)
    let sent = 0
    const CHUNK = 100

    for (let i = 0; i < firstBatch.length; i += CHUNK) {
      const chunk = firstBatch.slice(i, i + CHUNK)
      const { error } = await resend.batch.send(
        chunk.map((to) => ({
          from: FROM,
          to,
          subject,
          html: htmlBody,
          ...(cc ? { cc } : {}),
          ...(bcc ? { bcc } : {}),
          ...(resendAttachments ? { attachments: resendAttachments } : {}),
        }))
      )
      if (!error) sent += chunk.length
    }

    const newSentCount = sent
    const completed = newSentCount >= allRecipients.length

    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        sentCount: newSentCount,
        status: completed ? 'COMPLETED' : sent === 0 ? 'FAILED' : 'SENDING',
      },
    })

    return NextResponse.json({
      ok: true,
      campaignId: campaign.id,
      total: allRecipients.length,
      sent: newSentCount,
      remaining: allRecipients.length - newSentCount,
      status: completed ? 'COMPLETED' : 'SENDING',
    })
  } catch (err: any) {
    console.error('[EMAIL CAMPAIGN ERROR]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to send' }, { status: 500 })
  }
}
