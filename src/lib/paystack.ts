import crypto from 'crypto'
import prisma from '@/lib/prisma'

const API = 'https://api.paystack.co'

function secretKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null
}

export function paystackConfigured() {
  return !!secretKey()
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key. */
export function validSignature(rawBody: string, signature: string | null, key = secretKey()): boolean {
  if (!key || !signature) return false
  const expected = crypto.createHmac('sha512', key).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

interface InitArgs {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
  metadata: Record<string, string | number>
}

export async function initializeTransaction({ email, amountKobo, reference, callbackUrl, metadata }: InitArgs): Promise<string> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount: amountKobo, currency: 'NGN', reference, callback_url: callbackUrl, metadata }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.status || !data.data?.authorization_url) {
    throw new Error(`Paystack initialize failed: ${data?.message ?? res.status}`)
  }
  return data.data.authorization_url as string
}

interface VerifiedTx {
  status: string
  amount: number
  currency: string
  channel?: string
  paid_at?: string
}

async function verifyTransaction(reference: string): Promise<VerifiedTx | null> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.status || !data.data) return null
  return data.data as VerifiedTx
}

export type FulfilResult = 'credited' | 'already' | 'pending' | 'failed' | 'unknown'

/**
 * Confirm a payment with Paystack and add the credits. Called from both the
 * redirect page and the webhook; whichever runs first credits, the other is a no-op.
 * Never trusts the browser or the webhook body alone: it always re-verifies.
 */
export async function fulfilPayment(reference: string): Promise<FulfilResult> {
  const payment = await prisma.payment.findUnique({ where: { reference } })
  if (!payment) return 'unknown'
  if (payment.status === 'SUCCESS') return 'already'

  const tx = await verifyTransaction(reference)
  if (!tx) return 'pending'
  if (tx.status !== 'success') {
    if (['failed', 'abandoned', 'reversed'].includes(tx.status)) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
      return 'failed'
    }
    return 'pending'
  }
  // The amount and currency must match what we asked for
  if (tx.amount !== payment.amount || tx.currency !== payment.currency) {
    console.error('[paystack] amount mismatch', reference, tx.amount, payment.amount, tx.currency)
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
    return 'failed'
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', channel: tx.channel ?? null, paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date() },
    }),
    prisma.creditEntry.upsert({
      where: { reference: `pay:${reference}` },
      create: {
        userId: payment.userId,
        delta: payment.credits,
        reason: 'PURCHASE',
        reference: `pay:${reference}`,
        note: `${payment.credits} credits (${payment.packId})`,
      },
      update: {},
    }),
  ])
  return 'credited'
}
