export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { runCampaignSend } from '@/lib/email-utils'

// Daily cron  -  advance every in-progress campaign (Resend + SendChamp).
// Each run processes as far as its time budget allows and persists progress,
// so multi-day / very large sends finish reliably with no duplicates.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = prisma as any
  const campaigns = await db.emailCampaign.findMany({ where: { status: 'SENDING' } })
  if (campaigns.length === 0) return NextResponse.json({ message: 'No active campaigns', processed: 0 })

  const results: { id: string; sent: number; status: string }[] = []
  for (const campaign of campaigns) {
    try {
      const r = await runCampaignSend(campaign.id)
      results.push({ id: campaign.id, sent: r.sent, status: r.status })
    } catch (err: any) {
      console.error('[cron/email-campaigns]', campaign.id, err?.message ?? err)
      results.push({ id: campaign.id, sent: 0, status: 'ERROR' })
    }
  }
  return NextResponse.json({ processed: results.length, results })
}
