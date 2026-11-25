export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { ok, preflight, readJson, withUser } from '@/lib/mobile/http'

export const OPTIONS = preflight

/** GET the newest 50 notifications (same list as the website) and the unread count. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, type: true, title: true, message: true, link: true, read: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ])
    return ok(items.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })), { unread })
  })
}

/** PATCH { id } marks one read; PATCH { all: true } marks all read. */
export async function PATCH(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req)
    if (body?.all === true) {
      await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
    } else if (typeof body?.id === 'string') {
      await prisma.notification.updateMany({ where: { id: body.id, userId: user.id }, data: { read: true } })
    }
    const unread = await prisma.notification.count({ where: { userId: user.id, read: false } })
    return ok({ unread })
  })
}
