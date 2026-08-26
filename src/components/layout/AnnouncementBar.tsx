'use client'

import { useEffect, useState } from 'react'
import { X, Megaphone, ArrowRight } from 'lucide-react'

interface Announcement {
  enabled: boolean
  text: string
  link: string
  linkLabel: string
}

const DISMISS_KEY = 'xcel360_announcement_dismissed'

/**
 * Site-wide announcement bar managed from Admin → Site Settings.
 * Dismissible per-message: when the admin changes the text, the bar
 * reappears for visitors who dismissed the previous message.
 */
export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((data) => {
        const a = data?.announcement as Announcement | undefined
        if (a?.enabled && a.text) {
          setAnnouncement(a)
          try {
            setDismissed(localStorage.getItem(DISMISS_KEY) === a.text)
          } catch {
            setDismissed(false)
          }
        }
      })
      .catch(() => {})
  }, [])

  if (!announcement || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, announcement.text)
    } catch {}
  }

  return (
    <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 text-sm">
        <Megaphone className="h-4 w-4 shrink-0 text-brand-200" />
        <p className="font-medium text-center truncate">{announcement.text}</p>
        {announcement.link && (
          <a
            href={announcement.link}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold bg-white/15 hover:bg-white/25 transition-colors rounded-full px-3 py-1 shrink-0"
          >
            {announcement.linkLabel || 'Learn more'} <ArrowRight className="h-3 w-3" />
          </a>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="ml-1 p-1 rounded-md text-brand-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
