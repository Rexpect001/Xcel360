export const dynamic = 'force-dynamic'

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { findPack } from '@/lib/billing'
import { initializeTransaction, paystackConfigured } from '@/lib/paystack'

export async function POST(req: NextRequest) {
  const session = await getAuth()
  const userId = session?.user?.id
  const email = session?.user?.email
  if (!userId || !email) return NextResponse.json({ error: 'Please sign in to buy credits.' }, { status: 401 })

  if (!paystackConfigured()) {
    return NextResponse.json({ error: 'Payments are not available yet. Please try again later.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const pack = findPack(body.packId)
  if (!pack) return NextResponse.json({ error: 'Unknown credit pack' }, { status: 400 })

  const reference = `x360_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`
  const amountKobo = pack.priceNaira * 100
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  await prisma.payment.create({
    data: { userId, reference, packId: pack.id, credits: pack.credits, amount: amountKobo, currency: 'NGN' },
  })

  try {
    const url = await initializeTransaction({
      email,
      amountKobo,
      reference,
      callbackUrl: `${base}/dashboard/billing`,
      metadata: { userId, packId: pack.id, credits: pack.credits },
    })
    return NextResponse.json({ url })
  } catch (error) {
    console.error('[billing/checkout]', error)
    await prisma.payment.update({ where: { reference }, data: { status: 'FAILED' } }).catch(() => {})
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 502 })
  }
}
