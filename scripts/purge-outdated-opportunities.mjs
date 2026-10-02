/**
 * Purge outdated opportunities whose deadline is before a cutoff year.
 *
 * Background: dates entered without a year ("15 January") were parsed by V8 as
 * 2001-01-15, leaving ~86 scholarships with 2001 deadlines (plus a few 2010,
 * 2015 and 2023 ones). The app now hides these and parses deadlines safely;
 * this script removes them from the database.
 *
 * Usage (from the project root):
 *   node --env-file=.env.local scripts/purge-outdated-opportunities.mjs            # dry run
 *   node --env-file=.env.local scripts/purge-outdated-opportunities.mjs --confirm  # delete
 *   ... --before=2025   change the cutoff year (default 2025 = delete deadlines before 1 Jan 2025)
 *
 * A full JSON backup of every matched row is written to .tmp/ before deleting.
 * Rows that users have saved or are tracking are skipped (closed instead).
 */
import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'

const confirm = process.argv.includes('--confirm')
const beforeArg = process.argv.find((a) => a.startsWith('--before='))
const year = beforeArg ? parseInt(beforeArg.split('=')[1], 10) : 2025
if (!Number.isInteger(year) || year < 2000 || year > 2100) {
  console.error('Invalid --before year'); process.exit(1)
}
const cutoff = new Date(Date.UTC(year, 0, 1))

const prisma = new PrismaClient()
try {
  const rows = await prisma.opportunity.findMany({
    where: { deadline: { lt: cutoff } },
    include: { _count: { select: { savedBy: true, applications: true } } },
    orderBy: { deadline: 'asc' },
  })
  const inUse = rows.filter((r) => r._count.savedBy + r._count.applications > 0)
  const deletable = rows.filter((r) => r._count.savedBy + r._count.applications === 0)

  console.log(`Deadline before ${cutoff.toISOString().slice(0, 10)}: ${rows.length} opportunities`)
  console.log(`  deletable: ${deletable.length}   in use by users (will be closed, not deleted): ${inUse.length}`)
  for (const r of rows.slice(0, 15)) console.log(`  - ${r.deadline?.toISOString().slice(0, 10)}  ${r.title}`)
  if (rows.length > 15) console.log(`  ...and ${rows.length - 15} more`)

  if (!confirm) {
    console.log('\nDry run only. Re-run with --confirm to delete.')
  } else if (rows.length > 0) {
    fs.mkdirSync('.tmp', { recursive: true })
    const file = `.tmp/purged-opportunities-${new Date().toISOString().slice(0, 10)}.json`
    fs.writeFileSync(file, JSON.stringify(rows, null, 2))
    console.log(`\nBackup written to ${file}`)
    const del = await prisma.opportunity.deleteMany({ where: { id: { in: deletable.map((r) => r.id) } } })
    const closed = await prisma.opportunity.updateMany({ where: { id: { in: inUse.map((r) => r.id) } }, data: { status: 'CLOSED' } })
    console.log(`Deleted ${del.count}, closed ${closed.count}.`)
  }
} finally {
  await prisma.$disconnect()
}
