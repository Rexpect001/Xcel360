'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCheck, Calendar, Sparkles, Info } from 'lucide-react'
import { Notification, NotificationType } from '@prisma/client'
import { formatRelativeDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  DEADLINE_REMINDER: { icon: Calendar, color: 'bg-orange-100 text-orange-600' },
  NEW_OPPORTUNITY: { icon: Sparkles, color: 'bg-blue-100 text-blue-600' },
  APPLICATION_UPDATE: { icon: CheckCheck, color: 'bg-green-100 text-green-600' },
  GENERAL: { icon: Info, color: 'bg-surface-100 text-ink-600' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readAll: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Notifications</h1>
          <p className="text-ink-500 mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-brand-700 font-medium hover:text-brand-800 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <BellOff className="h-12 w-12 text-ink-200 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">No notifications yet.</p>
          <p className="text-sm text-ink-400">
            We'll alert you about deadlines and new scholarships that match your profile.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type] ?? typeConfig.GENERAL
            const Icon = config.icon
            const content = (
              <div
                key={notif.id}
                onClick={() => !notif.read && markRead(notif.id)}
                className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                  notif.read
                    ? 'bg-white border-surface-200 opacity-70'
                    : 'bg-blue-50/50 border-brand-100 hover:bg-blue-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-ink-900 text-sm">{notif.title}</div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-brand-700 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-ink-600 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-ink-400 mt-1">{formatRelativeDate(notif.createdAt)}</p>
                </div>
              </div>
            )

            return notif.link ? (
              <Link key={notif.id} href={notif.link}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
