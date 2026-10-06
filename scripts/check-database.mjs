import nextEnv from '@next/env'
import { PrismaClient } from '@prisma/client'

nextEnv.loadEnvConfig(process.cwd())

const prisma = new PrismaClient()
try {
  const databaseUrl = new URL(process.env.DATABASE_URL)
  const started = Date.now()
  const [opportunities, dynamicOgLinks, recentAiRuns] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { imageUrl: { contains: '/api/og' } } }),
    prisma.activityLog.count({
      where: { resource: 'ai', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ])

  // Exercise the same transaction-level advisory lock used by AI quotas,
  // without writing a user record or consuming anyone's allowance.
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`health:${Date.now()}`}, 0))::text AS locked`
  })

  console.log(JSON.stringify({
    status: 'ok',
    latencyMs: Date.now() - started,
    opportunities,
    dynamicOgLinks,
    aiRunsLast24h: recentAiRuns,
    aiQuotaLock: 'ok',
    pooler: {
      transactionPort: databaseUrl.port === '6543',
      pgbouncer: databaseUrl.searchParams.get('pgbouncer') === 'true',
      connectionLimit: databaseUrl.searchParams.get('connection_limit') ?? 'default',
    },
  }, null, 2))
} finally {
  await prisma.$disconnect()
}
