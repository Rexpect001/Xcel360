export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { sendDeadlineReminders } from '@/lib/notifications'
import { sendWeeklyDigestBatch } from '@/lib/weekly-digest'
import { runCampaignSend } from '@/lib/email-utils'
import prisma from '@/lib/prisma'

/**
 * Consolidated daily cron - Vercel's free Hobby tier allows at most 2 cron
 * jobs, so the fast jobs (deadline reminders, campaign batches, closing
 * expired opportunities, weekly digest) run together here. The long-running auto-discovery job stays on its
 * own route (/api/cron/auto-discover).
 *
 * Each job is isolated: a failure in one never blocks the others, and every
 * job is resumable, so a partial run simply continues tomorrow.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // 1. Deadline reminders for saved/tracked opportunities
  try {
    await sendDeadlineReminders()
    results.deadlineReminders = { ok: true }
  } catch (err) {
    console.error('[cron/daily] deadline-reminders failed', err)
    results.deadlineReminders = { ok: false, error: err instanceof Error ? err.message : 'Unknown' }
  }

  // 2. Advance any in-progress email campaigns (batched sends)
  try {
    const db = prisma as any
    const campaigns = await db.emailCampaign.findMany({ where: { status: 'SENDING' } })
    const campaignResults: { id: string; sent: number; status: string }[] = []
    for (const campaign of campaigns) {
      try {
        const r = await runCampaignSend(campaign.id)
        campaignResults.push({ id: campaign.id, sent: r.sent, status: r.status })
      } catch (err) {
        console.error('[cron/daily] campaign failed', campaign.id, err)
        campaignResults.push({ id: campaign.id, sent: 0, status: 'ERROR' })
      }
    }
    results.emailCampaigns = { ok: true, processed: campaignResults.length, results: campaignResults }
  } catch (err) {
    console.error('[cron/daily] email-campaigns failed', err)
    results.emailCampaigns = { ok: false, error: err instanceof Error ? err.message : 'Unknown' }
  }

  // 3. Close opportunities whose deadline has passed (reversible - status only)
  try {
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    const closed = await prisma.opportunity.updateMany({
      where: { status: 'OPEN', deadline: { lt: cutoff } },
      data: { status: 'CLOSED' },
    })
    results.closeExpired = { ok: true, closed: closed.count }
  } catch (err) {
    console.error('[cron/daily] close-expired failed', err)
    results.closeExpired = { ok: false, error: err instanceof Error ? err.message : 'Unknown' }
  }

  // 4. Weekly digest batch (internally no-ops once this week's run completes)
  try {
    results.weeklyDigest = await sendWeeklyDigestBatch(100)
  } catch (err) {
    console.error('[cron/daily] weekly-digest failed', err)
    results.weeklyDigest = { ok: false, error: err instanceof Error ? err.message : 'Unknown' }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results })
}
