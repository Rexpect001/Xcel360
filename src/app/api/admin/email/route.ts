export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <onboarding@resend.dev>'

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

// POST — create and start sending a campaign
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const { subject, htmlBody, audience, dailyLimit = 100, sendAll = false } = await req.json()

    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    if (!htmlBody?.trim()) return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
    if (!audience) return NextResponse.json({ error: 'Audience is required' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

    // Build recipient list
    const emails = new Set<string>()

    if (audience === 'users' || audience === 'both') {
      const users = await prisma.user.findMany({ select: { email: true } })
      users.forEach((u) => emails.add(u.email))
    }

    if (audience === 'subscribers' || audience === 'both') {
      const subs = await (prisma as any).emailSubscriber.findMany({ select: { email: true } })
      subs.forEach((s: any) => emails.add(s.email))
    }

    const allRecipients = Array.from(emails)
    const limit = sendAll ? allRecipients.length : Math.min(dailyLimit, 100)
    const firstBatch = allRecipients.slice(0, limit)

    // Create campaign record
    const db = prisma as any
    const campaign = await db.emailCampaign.create({
      data: {
        subject,
        htmlBody,
        audience,
        dailyLimit: Math.min(dailyLimit, 100),
        recipients: JSON.stringify(allRecipients),
        totalCount: allRecipients.length,
        sentCount: 0,
        status: 'SENDING',
      },
    })

    // Send first batch
    const resend = new Resend(apiKey)
    let sent = 0
    const errors: string[] = []

    // Resend batch: up to 100 per call
    const BATCH_SIZE = 100
    for (let i = 0; i < firstBatch.length; i += BATCH_SIZE) {
      const chunk = firstBatch.slice(i, i + BATCH_SIZE)
      const { error } = await resend.batch.send(
        chunk.map((to) => ({ from: FROM, to, subject, html: htmlBody }))
      )
      if (error) {
        errors.push(error.message)
      } else {
        sent += chunk.length
      }
    }

    const newSentCount = sent
    const completed = newSentCount >= allRecipients.length

    await db.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        sentCount: newSentCount,
        status: completed ? 'COMPLETED' : errors.length > 0 && sent === 0 ? 'FAILED' : 'SENDING',
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
