export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sendDeadlineReminders } from '@/lib/notifications'

// Called daily by the Azure Logic Apps scheduler.
// Protect with a secret header in production
export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await sendDeadlineReminders()
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}
