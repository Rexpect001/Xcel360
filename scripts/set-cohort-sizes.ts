/**
 * Set the official participant count for each mentorship cohort.
 * The Events page shows this number (falling back to the count of listed
 * beneficiaries when it is 0). Admins can also edit it in Admin -> Programs.
 *
 *   npx tsx --env-file=.env.local scripts/set-cohort-sizes.ts            (dry run)
 *   npx tsx --env-file=.env.local scripts/set-cohort-sizes.ts --confirm  (writes)
 */
import prisma from '../src/lib/prisma'

const SIZES: Record<number, number> = { 1: 100, 2: 50, 3: 60 }
const confirm = process.argv.includes('--confirm')

async function main() {
  const programs = await prisma.program.findMany({
    where: { cohortNumber: { in: Object.keys(SIZES).map(Number) } },
    select: { id: true, title: true, cohortNumber: true, participants: true },
    orderBy: { cohortNumber: 'asc' },
  })
  if (programs.length === 0) console.log('No cohort 1-3 programs found.')
  for (const p of programs) {
    const target = SIZES[p.cohortNumber!]
    console.log(`Cohort ${p.cohortNumber} (${p.title}): ${p.participants} -> ${target}`)
    if (confirm && p.participants !== target) {
      await prisma.program.update({ where: { id: p.id }, data: { participants: target } })
    }
  }
  if (!confirm) console.log('Dry run. Re-run with --confirm to save.')
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
