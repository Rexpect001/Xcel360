export const dynamic = 'force-dynamic'
export const maxDuration = 60 // allow time to send a large SendChamp batch in one request
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { runCampaignSend } from '@/lib/email-utils'

// Resend free plan caps at 100/day; SendChamp is paid with no hard cap
function maxLimit(provider: string) { return provider === 'sendchamp' ? 5000 : 100 }

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
    subject, htmlBody, textBody = '', audience, eventId,
    provider = 'resend',
    dailyLimit = 100,
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
  if (audience === 'contacts') {
    const contacts = await (prisma as any).contact.findMany({ select: { email: true } })
    contacts.forEach((c: any) => emails.add(c.email.toLowerCase().trim()))
  }
  if (audience === 'event') {
    if (!eventId) return NextResponse.json({ error: 'Select an event for this audience' }, { status: 400 })
    const regs = await (prisma as any).eventRegistration.findMany({
      where: { eventId }, select: { email: true },
    })
    regs.forEach((r: any) => { if (r.email) emails.add(r.email.toLowerCase().trim()) })
  }
  manualRecipients.forEach((e: string) => { const t = e.toLowerCase().trim(); if (t) emails.add(t) })

  const allRecipients = Array.from(emails)
  if (allRecipients.length === 0) return NextResponse.json({ error: 'No recipients found' }, { status: 400 })

  const db = prisma as any

  if (isDraft) {
    const campaign = await db.emailCampaign.create({
      data: {
        subject, htmlBody, textBody: textBody || null, audience, provider,
        dailyLimit: Math.min(dailyLimit, maxLimit(provider)),
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

  // Validate provider key before creating campaign
  if (provider === 'resend' && !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })
  }
  if (provider === 'sendchamp' && !process.env.SENDCHAMP_API_KEY) {
    return NextResponse.json({ error: 'SENDCHAMP_API_KEY not configured' }, { status: 503 })
  }

  const campaign = await db.emailCampaign.create({
    data: {
      subject, htmlBody, textBody: textBody || null, audience, provider,
      dailyLimit: Math.min(dailyLimit, maxLimit(provider)),
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

  // Durable, resumable send. For very large lists this returns after a time
  // budget with status SENDING; the Resume button / daily cron finishes the rest.
  const result = await runCampaignSend(campaign.id)

  return NextResponse.json({
    ok: true, campaignId: campaign.id,
    total: result.total, sent: result.sent,
    remaining: result.total - result.cursor,
    status: result.status,
  })
}
