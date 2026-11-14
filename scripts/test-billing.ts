/**
 * Offline checks for billing logic (no database, no Paystack calls).
 *   npx tsx scripts/test-billing.ts
 */
import crypto from 'crypto'
import { CREDIT_PACKS, CREDITS_PER_USE, FREE_CREDITS, MIN_TOOL_CREDITS, TOOL_CREDITS, creditsFor, findPack, formatNaira, pricePerUse, savingsPercent, usesFor, legacyConversionDelta, purchaseCredits } from '../src/lib/billing'
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
expect('finds packs by id only', findPack('starter')?.credits === 200 && findPack('season')?.priceNaira === 20000 && findPack('free') === null && findPack(undefined) === null)
expect('pack ids are unique', new Set(CREDIT_PACKS.map((p) => p.id)).size === CREDIT_PACKS.length)
expect('every pack has positive credits and price', CREDIT_PACKS.every((p) => p.credits > 0 && p.priceNaira >= 100 && Number.isInteger(p.priceNaira)))
expect('bigger packs never cost more per credit', CREDIT_PACKS.every((p, i) => i === 0 || p.priceNaira / p.credits <= CREDIT_PACKS[i - 1].priceNaira / CREDIT_PACKS[i - 1].credits))
expect('free credits cover at least 5 of the priciest drafts', FREE_CREDITS >= 5 * Math.max(...Object.values(TOOL_CREDITS)))
expect('every tool has a whole, positive price', Object.values(TOOL_CREDITS).every((n) => Number.isInteger(n) && n > 0))
expect('agreed prices: CV 5, SOP 10, cover letter 7, email 5, Launchpad 5/10/12', [creditsFor('cv'), creditsFor('sop'), creditsFor('cover-letter'), creditsFor('cold-email'), creditsFor('startup-idea'), creditsFor('startup-interviews'), creditsFor('startup-roadmap')].join() === '5,10,7,5,5,10,12')
expect('cheapest draft costs 5', MIN_TOOL_CREDITS === 5)
expect('every pack buys whole drafts', CREDIT_PACKS.every((p) => p.credits % CREDITS_PER_USE === 0))
expect('price per draft: 1000 / 800', CREDIT_PACKS.map(pricePerUse).join('/') === '1000/800')
expect('savings shown against the starter pack', savingsPercent(CREDIT_PACKS[0]) === 0 && savingsPercent(CREDIT_PACKS[1]) === 20)
expect('uses never negative and round down', usesFor(-5) === 0 && usesFor(19) === 0 && usesFor(39) === 1)
// Old units: 1 credit = 1 draft, 3 free credits
expect('untouched old account ends on exactly 100', 3 + legacyConversionDelta(3, 3) === 100)
expect('old account that used its free drafts gets the 40 top-up', 0 + legacyConversionDelta(0, 3) === 40)
expect('old paid balance keeps its value in drafts', usesFor(13 + legacyConversionDelta(13, 3)) === 13 + 2)
expect('negative old balance is not amplified', legacyConversionDelta(-2, 3) === 40)
expect('new checkouts credit what the pack says', purchaseCredits(10000 * 100, 200) === 200 && purchaseCredits(20000 * 100, 500) === 500)
expect('old checkouts (N3,000 for 10) keep 10 drafts', usesFor(purchaseCredits(3000 * 100, 10)) === 10)
expect('old 80-credit checkout is converted too', purchaseCredits(16000 * 100, 80) === 1600)
expect('zero-credit payment adds nothing', purchaseCredits(100, 0) === 0)
expect('formats Naira', formatNaira(7500) === '₦7,500')

console.log(failed ? `\n${failed} failed\n` : '\nAll passed\n')
process.exit(failed ? 1 : 0)
