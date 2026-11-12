/**
 * Offline checks for billing logic (no database, no Paystack calls).
 *   npx tsx scripts/test-billing.ts
 */
import crypto from 'crypto'
import { CREDIT_PACKS, FREE_CREDITS, findPack, formatNaira } from '../src/lib/billing'
import { validSignature } from '../src/lib/paystack'

let failed = 0
function expect(name: string, ok: boolean) {
  if (!ok) failed++
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}`)
}

console.log('\nBilling')
const key = 'sk_test_example'
const body = JSON.stringify({ event: 'charge.success', data: { reference: 'x360_abc' } })
const sig = crypto.createHmac('sha512', key).update(body).digest('hex')
expect('accepts a correctly signed webhook', validSignature(body, sig, key))
expect('rejects a tampered body', !validSignature(body.replace('abc', 'xyz'), sig, key))
expect('rejects a wrong key', !validSignature(body, crypto.createHmac('sha512', 'other').update(body).digest('hex'), key))
expect('rejects a missing signature', !validSignature(body, null, key))
expect('rejects when no secret key is set', !validSignature(body, sig, null))
expect('finds packs by id only', findPack('standard')?.credits === 30 && findPack('free') === null && findPack(undefined) === null)
expect('pack ids are unique', new Set(CREDIT_PACKS.map((p) => p.id)).size === CREDIT_PACKS.length)
expect('every pack has positive credits and price', CREDIT_PACKS.every((p) => p.credits > 0 && p.priceNaira >= 100 && Number.isInteger(p.priceNaira)))
expect('bigger packs never cost more per credit', CREDIT_PACKS.every((p, i) => i === 0 || p.priceNaira / p.credits <= CREDIT_PACKS[i - 1].priceNaira / CREDIT_PACKS[i - 1].credits))
expect('free credits are a small positive number', FREE_CREDITS > 0 && FREE_CREDITS <= 10)
expect('formats Naira', formatNaira(7500) === '₦7,500')

console.log(failed ? `\n${failed} failed\n` : '\nAll passed\n')
process.exit(failed ? 1 : 0)
