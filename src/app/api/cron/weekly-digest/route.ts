export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { sendWeeklyDigestBatch } from '@/lib/weekly-digest'

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendWeeklyDigestBatch(100)
  return NextResponse.json(result)
}
