'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, X, ArrowRight } from 'lucide-react'
import { NOTIFICATIONS_EVENT } from '@/components/dashboard/useUnreadNotifications'

export interface Notice {
  id: string
  title: string
  message: string
  link: string | null
}

/** The newest unread notification, shown on the dashboard home until read or dismissed. */
export default function LatestNotice({ notice, unread }: { notice: Notice; unread: number }) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null

  const markRead = () => {
    setHidden(true)
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notice.id }),
    })
      .then(() => window.dispatchEvent(new Event(NOTIFICATIONS_EVENT)))
      .catch(() => {})
  }

  const external = !!notice.link && /^https?:\/\//i.test(notice.link)

  return (
    <section aria-label="Latest notification" className="mb-3 flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-4">
      <span className="h-9 w-9 shrink-0 rounded-xl bg-white flex items-center justify-center ring-1 ring-accent-200">
        <Bell className="h-4 w-4 text-accent-700" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900">{notice.title}</p>
        <p className="mt-0.5 text-sm text-ink-700 whitespace-pre-line">{notice.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {notice.link && (
            external ? (
              <a href={notice.link} target="_blank" rel="noopener noreferrer" onClick={markRead} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link href={notice.link} onClick={markRead} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )
          )}
          {unread > 1 && (
            <Link href="/dashboard/notifications" className="text-ink-600 hover:text-ink-900">
              See all {unread} unread
            </Link>
          )}
        </div>
      </div>
      <button type="button" onClick={markRead} aria-label="Mark as read and hide" title="Mark as read" className="p-1.5 rounded-lg text-ink-400 hover:bg-white hover:text-ink-700">
        <X className="h-4 w-4" />
      </button>
    </section>
  )
}
