export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Send, Users, Eye } from 'lucide-react'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { BROADCAST_ACTION, parseBroadcastDetails } from '@/lib/broadcast'
import BroadcastForm from './BroadcastForm'

export const metadata = { title: 'Notifications' }

/** Notifications for one send are created just before its history entry is written. */
const SEND_WINDOW_MS = 15 * 60 * 1000

async function getHistory() {
  const logs = await prisma.activityLog.findMany({
    where: { action: BROADCAST_ACTION },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, createdAt: true, userEmail: true, details: true },
  })
  return Promise.all(
    logs.map(async (log) => {
      const d = parseBroadcastDetails(log.details)
      if (!d) return null
      const window = { gte: new Date(log.createdAt.getTime() - SEND_WINDOW_MS), lte: new Date(log.createdAt.getTime() + 5000) }
      const read = await prisma.notification
        .count({ where: { title: d.title, message: d.message, read: true, createdAt: window } })
        .catch(() => 0)
      return { id: log.id, at: log.createdAt, by: log.userEmail, read, ...d }
    }),
  ).then((rows) => rows.filter((r): r is NonNullable<typeof r> => !!r))
}

export default async function AdminNotificationsPage() {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') redirect('/admin')

  const [levels, history] = await Promise.all([
    prisma.profile
      .groupBy({ by: ['level'], where: { level: { not: null }, notifyInApp: true }, _count: true })
      .then((rows) => rows.filter((r) => r.level && r.level.trim()).sort((a, b) => b._count - a._count).map((r) => ({ level: r.level as string, count: r._count }))),
    getHistory(),
  ])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ink-900">Notifications</h1>
        <p className="text-ink-500 mt-1 max-w-2xl">
          Send a notice to users&apos; Notifications. They see an unread count in their menu, a pop-up the next time they use the
          dashboard, and the notice on their dashboard home. Users who turned off in-app notifications are skipped.
        </p>
      </header>

      <BroadcastForm levels={levels} />

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="font-bold text-ink-900 mb-3">Sent notifications</h2>
        {history.length === 0 ? (
          <p className="paper-card p-6 text-sm text-ink-500">Nothing sent yet. Notices you send (not tests) appear here with how many people have read them.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="paper-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{h.title}</p>
                    <p className="mt-1 text-sm text-ink-600 whitespace-pre-line">{h.message}</p>
                    {h.link && <p className="mt-1 text-xs text-brand-700 break-all">{h.link}</p>}
                  </div>
                  <div className="flex gap-4 text-sm text-ink-600 shrink-0">
                    <span className="inline-flex items-center gap-1.5" title="Delivered"><Send className="h-4 w-4 text-ink-400" /> {h.sent.toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1.5" title="Read">
                      <Eye className="h-4 w-4 text-ink-400" /> {h.read.toLocaleString()}
                      {h.sent > 0 && <span className="text-ink-400">({Math.round((h.read / h.sent) * 100)}%)</span>}
                    </span>
                  </div>
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {h.audience === 'level' ? `${h.level} students` : 'Everyone'}</span>
                  <span>{formatDistanceToNow(h.at, { addSuffix: true })}</span>
                  {h.by && <span>by {h.by}</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
