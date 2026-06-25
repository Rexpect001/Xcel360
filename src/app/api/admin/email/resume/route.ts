export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { runCampaignSend } from '@/lib/email-utils'

// POST — manually resume all SENDING campaigns (same logic as cron).
export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const db = prisma as any
  const campaigns = await db.emailCampaign.findMany({ where: { status: 'SENDING' } })
  if (campaigns.length === 0) return NextResponse.json({ message: 'No SENDING campaigns to resume', processed: 0 })

  const results: { id: string; sent: number; status: string }[] = []
  for (const campaign of campaigns) {
    try {
      const r = await runCampaignSend(campaign.id)
      results.push({ id: campaign.id, sent: r.sent, status: r.status })
    } catch (err: any) {
      console.error('[email/resume]', campaign.id, err?.message ?? err)
      results.push({ id: campaign.id, sent: 0, status: 'ERROR' })
    }
  }
  return NextResponse.json({ processed: results.length, results })
}
