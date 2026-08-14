export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { runCampaignSend } from '@/lib/email-utils'

// PATCH  -  send a DRAFT, resume/cancel a SENDING, or retry a FAILED campaign.
// All sending delegates to the centralized, resumable runCampaignSend.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

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

  // Allowed status per action
  const allowed: Record<string, string> = { send: 'DRAFT', resume: 'SENDING', retry: 'FAILED' }
  if (!['send', 'resume', 'retry'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (campaign.status !== allowed[action]) {
    return NextResponse.json({ error: `Only ${allowed[action]} campaigns can be ${action}d` }, { status: 400 })
  }

  try {
    const result = await runCampaignSend(params.id, { restart: action === 'retry' })
    return NextResponse.json({
      ok: true, sent: result.sent, total: result.total,
      remaining: result.total - result.cursor, status: result.status,
    })
  } catch (e: any) {
    const msg = e?.message ?? 'Send failed'
    const code = /not configured|required/i.test(msg) ? 503 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}

// GET  -  fetch logs for a specific campaign
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

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

// DELETE  -  delete a campaign and its logs
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole('ADMIN') } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

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
