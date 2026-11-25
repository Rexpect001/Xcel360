import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// The database URLs in use carry connection_limit=1, which makes every query in
// the container wait for one shared connection. When several pages render at
// once (after a deploy, or crawlers hitting listing pages) they time out after
// 10 s with P2024 and pages crash or render empty. Enforce a floor here so the
// fix does not depend on how the URL is configured in each environment.
// Override with DB_CONNECTION_LIMIT / DB_POOL_TIMEOUT if needed.
const MIN_CONNECTIONS = Number(process.env.DB_CONNECTION_LIMIT ?? 5)
const MIN_POOL_TIMEOUT = Number(process.env.DB_POOL_TIMEOUT ?? 20)

function tunedDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    const limit = Number(url.searchParams.get('connection_limit') ?? 0)
    if (!limit || limit < MIN_CONNECTIONS) url.searchParams.set('connection_limit', String(MIN_CONNECTIONS))
    const timeout = Number(url.searchParams.get('pool_timeout') ?? 0)
    if (!timeout || timeout < MIN_POOL_TIMEOUT) url.searchParams.set('pool_timeout', String(MIN_POOL_TIMEOUT))
    return url.toString()
  } catch {
    return raw
  }
}

type NotificationRow = { userId?: unknown; title?: unknown; message?: unknown; link?: unknown }

/**
 * Every in-app notification is also pushed to the user's phones (mobile app),
 * wherever it is created: deadline reminders, admin broadcasts, credit gifts,
 * advisor replies. Runs after the write succeeds and never blocks or fails it.
 */
function pushNotifications(data: NotificationRow | NotificationRow[]) {
  const rows = (Array.isArray(data) ? data : [data]).filter(
    (r): r is { userId: string; title: string; message: string; link?: string | null } =>
      typeof r.userId === 'string' && typeof r.title === 'string' && typeof r.message === 'string',
  )
  if (!rows.length) return
  import('@/lib/push')
    .then(({ sendPush }) => sendPush(rows.map((r) => ({ userId: r.userId, title: r.title, body: r.message, link: r.link }))))
    .catch((e) => console.error('[push] hook failed', e))
}

function createClient() {
  const url = tunedDatabaseUrl()
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  })
  client.$use(async (params, next) => {
    const result = await next(params)
    if (params.model === 'Notification' && (params.action === 'create' || params.action === 'createMany')) {
      pushNotifications(params.args?.data ?? [])
    }
    return result
  })
  return client
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
