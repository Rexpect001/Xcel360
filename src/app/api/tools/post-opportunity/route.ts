import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOpportunityFromPoster } from '@/lib/poster/create-opportunity'

export const dynamic = 'force-dynamic'

// External API used by the standalone tool (tool.thexcel360.com), authenticated
// with the shared TOOLS_SECRET. The in-app poster page at /post uses
// /api/tools/poster/* instead; both share createOpportunityFromPoster.

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.TOOLS_SECRET
  return !!(secret && auth === `Bearer ${secret}`)
}

// ── GET  -  health / stats ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = prisma as any
  try {
    const total = await db.opportunity.count()
    const recent = await db.opportunity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, category: true, status: true, createdAt: true },
    })
    return NextResponse.json({ ok: true, total, recent })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: true, message: 'Connected but DB query failed', error: msg })
  }
}

// ── POST  -  create opportunity ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Reject oversized payloads (100 KB cap)
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > 100_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await createOpportunityFromPoster(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json(result.data)
}
