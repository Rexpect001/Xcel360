export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { fulfilPayment, validSignature } from '@/lib/paystack'

/**
 * Paystack webhook. Set this URL in the Paystack dashboard:
 *   https://thexcel360.com/api/billing/paystack/webhook
 * Credits are added only after fulfilPayment re-verifies the payment with Paystack.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!validSignature(raw, req.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event?: string; data?: { reference?: string } }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (event.event === 'charge.success' && typeof event.data?.reference === 'string') {
    try {
      const result = await fulfilPayment(event.data.reference)
      console.log('[paystack webhook]', event.data.reference, result)
    } catch (error) {
      console.error('[paystack webhook] fulfil failed', error)
      // A 500 makes Paystack retry later
      return NextResponse.json({ error: 'Retry' }, { status: 500 })
    }
  }
  return NextResponse.json({ received: true })
}
