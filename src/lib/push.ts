import prisma from '@/lib/prisma'

/**
 * Push notifications to the Xcel360 mobile app through Expo's push service,
 * which relays to Apple (APNs) and Google (FCM). Every in-app notification is
 * also pushed to the user's phones, so it buzzes even when the app is closed.
 *
 * Never throws: a push failure must not break whatever created the notification.
 */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const BATCH = 100 // Expo's per-request limit

export interface PushMessage {
  userId: string
  title: string
  body: string
  /** Where tapping the notification should go (a site path or https link). */
  link?: string | null
}

/** Absolute path in the app for a site link, so a tap opens the right screen. */
function appRoute(link?: string | null): string {
  if (!link) return '/notifications'
  const m = link.match(/^\/(opportunities|jobs|internships)\/([a-z0-9]+)/i)
  if (m) return `/opportunity/${m[2]}`
  const t = link.match(/^\/scholarships\/([a-z0-9-]+)/i)
  if (t) return `/topic/${t[1]}`
  return '/notifications'
}

export async function sendPush(messages: PushMessage[]): Promise<void> {
  try {
    if (!messages.length) return
    const userIds = Array.from(new Set(messages.map((m) => m.userId)))
    const tokens = await prisma.pushToken.findMany({ where: { userId: { in: userIds } }, select: { token: true, userId: true } })
    if (!tokens.length) return

    const byUser = new Map<string, string[]>()
    for (const t of tokens) byUser.set(t.userId, [...(byUser.get(t.userId) ?? []), t.token])

    // Unread counts so the app icon badge is right
    const unread = await prisma.notification.groupBy({ by: ['userId'], where: { userId: { in: Array.from(byUser.keys()) }, read: false }, _count: true })
    const badge = new Map(unread.map((u) => [u.userId, u._count]))

    const payloads = messages.flatMap((m) =>
      (byUser.get(m.userId) ?? []).map((to) => ({
        to,
        title: m.title.slice(0, 120),
        body: m.body.slice(0, 240),
        sound: 'default',
        priority: 'high',
        channelId: 'updates',
        badge: badge.get(m.userId) ?? 1,
        data: { route: appRoute(m.link) },
      })),
    )

    const dead: string[] = []
    for (let i = 0; i < payloads.length; i += BATCH) {
      const chunk = payloads.slice(i, i + BATCH)
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN && { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }),
        },
        body: JSON.stringify(chunk),
      }).catch(() => null)
      if (!res?.ok) continue
      const json = (await res.json().catch(() => null)) as { data?: { status: string; details?: { error?: string } }[] } | null
      // Forget phones that uninstalled the app or revoked permission
      json?.data?.forEach((ticket, idx) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') dead.push(chunk[idx].to)
      })
    }
    if (dead.length) await prisma.pushToken.deleteMany({ where: { token: { in: dead } } })
  } catch (error) {
    console.error('[push] send failed', error)
  }
}
