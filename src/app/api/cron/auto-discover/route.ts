export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { runDiscovery } from '@/lib/agent/discover'
import { revalidateOpportunityPages } from '@/lib/revalidate-opportunities'

/**
 * Auto-Discovery Cron  -  runs every 8 hours via Vercel Cron
 * Searches the web for new scholarships/internships, validates them,
 * and saves them directly to the DB.
 *
 * Protected by CRON_SECRET. Requires SERPER_API_KEY + ANTHROPIC_API_KEY.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  try {
    const report = await runDiscovery()
    const duration = ((Date.now() - start) / 1000).toFixed(1)
    if (report.saved > 0) revalidateOpportunityPages()

    console.log(`[AUTO-DISCOVER] ✓ ${report.saved} saved, ${report.skipped} skipped, ${report.errors} errors  -  ${duration}s`)
    if (report.missingKeys.length) {
      console.warn('[AUTO-DISCOVER] Missing env vars:', report.missingKeys.join(', '))
    }

    return NextResponse.json({
      ok: true,
      duration: `${duration}s`,
      ...report,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[AUTO-DISCOVER] Fatal:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
