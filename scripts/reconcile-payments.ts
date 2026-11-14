/**
 * Settle old Paystack checkouts that are still PENDING (user closed the tab,
 * webhook missed, or started before the Nov 2026 pricing change).
 * Each one is re-verified with Paystack: paid ones are credited (old-unit
 * checkouts are converted to the new units), failed or abandoned ones are marked
 * FAILED, and anything Paystack still reports as in progress is left alone.
 *
 *   npx tsx --env-file=.env.local scripts/reconcile-payments.ts            (dry run: lists only)
 *   npx tsx --env-file=.env.local scripts/reconcile-payments.ts --confirm  (writes)
 *
 * Needs DATABASE_URL and PAYSTACK_SECRET_KEY. Safe to run more than once.
 */
import prisma from '../src/lib/prisma'
import { fulfilPayment, paystackConfigured } from '../src/lib/paystack'
import { purchaseCredits } from '../src/lib/billing'

const confirm = process.argv.includes('--confirm')
const OLDER_THAN_MINUTES = 30 // leave checkouts that may still be in progress

async function main() {
  if (!paystackConfigured()) throw new Error('PAYSTACK_SECRET_KEY is not set')
  const cutoff = new Date(Date.now() - OLDER_THAN_MINUTES * 60_000)
  const pending = await prisma.payment.findMany({
    where: { status: 'PENDING', createdAt: { lt: cutoff } },
    orderBy: { createdAt: 'asc' },
    select: { reference: true, amount: true, credits: true, createdAt: true },
  })
  console.log(`${pending.length} pending checkout(s) older than ${OLDER_THAN_MINUTES} minutes${confirm ? '' : ' (dry run)'}`)

  const tally: Record<string, number> = {}
  for (const p of pending) {
    const line = `${p.reference}  N${p.amount / 100}  ${p.createdAt.toISOString().slice(0, 10)}  -> ${purchaseCredits(p.amount, p.credits)} credits if paid`
    if (!confirm) {
      console.log('  ' + line)
      continue
    }
    const result = await fulfilPayment(p.reference).catch((e) => `error: ${e instanceof Error ? e.message : e}`)
    tally[result] = (tally[result] ?? 0) + 1
    console.log(`  ${line}  [${result}]`)
  }
  if (confirm) console.log('Summary:', tally)
  else if (pending.length) console.log('Re-run with --confirm to settle them.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
