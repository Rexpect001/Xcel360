export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { sendWeeklyDigestBatch } from '@/lib/weekly-digest'

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendWeeklyDigestBatch(100)
  return NextResponse.json(result)
}
