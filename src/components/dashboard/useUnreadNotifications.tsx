'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'react-hot-toast'

/** Fired after notifications are read, so the badge updates straight away. */
export const NOTIFICATIONS_EVENT = 'xcel:notifications'

export interface UnreadNotice {
  id: string
  title: string
  message: string
  link: string | null
  createdAt: string
}

const POLL_MS = 3 * 60 * 1000
const SEEN_KEY = 'xcel360_toasted_notifications'
/** Only toast notices from the last 3 days, so a returning user is not flooded with old ones. */
const TOAST_WINDOW_MS = 3 * 864e5

function seenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) } catch { return new Set() }
}
function rememberSeen(ids: string[]) {
  try {
    const all = Array.from(new Set([...ids, ...Array.from(seenIds())])).slice(0, 100)
    localStorage.setItem(SEEN_KEY, JSON.stringify(all))
  } catch { /* storage unavailable */ }
}

/**
 * Unread notification count for the dashboard shell. Refreshes on page change,
 * when the tab regains focus, every few minutes while visible, and whenever the
 * notifications page marks something read. A newly arrived notice pops up once
 * as a toast.
 */
export function useUnreadNotifications(enabled: boolean) {
  const pathname = usePathname()
  const [count, setCount] = useState<number | undefined>(undefined)
  const lastFetch = useRef(0)

  const refresh = useCallback(async (force = false) => {
    if (!enabled) return
    if (!force && Date.now() - lastFetch.current < 15_000) return
    lastFetch.current = Date.now()
    try {
      const r = await fetch('/api/notifications/unread', { cache: 'no-store' })
      if (!r.ok) return
      const d: { count: number; latest: UnreadNotice[] } = await r.json()
      setCount(d.count)

      const seen = seenIds()
      const fresh = d.latest.filter((n) => !seen.has(n.id) && Date.now() - new Date(n.createdAt).getTime() < TOAST_WINDOW_MS)
      if (fresh.length) {
        const n = fresh[0]
        toast(
          (t) => (
            <a
              href={n.link || '/dashboard/notifications'}
              onClick={() => toast.dismiss(t.id)}
              className="block max-w-xs"
            >
              <span className="block text-sm font-semibold text-ink-900">{n.title}</span>
              <span className="mt-0.5 block text-xs text-ink-600 line-clamp-2">{n.message}</span>
              {fresh.length > 1 && <span className="mt-1 block text-xs font-semibold text-brand-700">+{fresh.length - 1} more in Notifications</span>}
            </a>
          ),
          { icon: '🔔', duration: 8000, id: `notice-${n.id}` },
        )
        rememberSeen(d.latest.map((x) => x.id))
      }
    } catch { /* offline: try again later */ }
  }, [enabled])

  useEffect(() => { refresh() }, [refresh, pathname])

  useEffect(() => {
    if (!enabled) return
    const onFocus = () => refresh()
    const onRead = () => refresh(true)
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(true) }, POLL_MS)
    window.addEventListener('focus', onFocus)
    window.addEventListener(NOTIFICATIONS_EVENT, onRead)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(NOTIFICATIONS_EVENT, onRead)
    }
  }, [enabled, refresh])

  return count
}
