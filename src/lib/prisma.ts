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

function createClient() {
  const url = tunedDatabaseUrl()
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
