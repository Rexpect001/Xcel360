export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { unsubscribeToken } from '@/lib/email-utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.toLowerCase().trim() ?? ''
  const token = searchParams.get('token') ?? ''

  if (!email || !token) {
    return NextResponse.redirect(new URL('/unsubscribe?status=invalid', req.url))
  }

  const expected = unsubscribeToken(email)
  if (token !== expected) {
    return NextResponse.redirect(new URL('/unsubscribe?status=invalid', req.url))
  }

  const db = prisma as any
  await db.emailUnsubscribe.upsert({
    where: { email },
    update: {},
    create: { email },
  })

  return NextResponse.redirect(new URL('/unsubscribe?status=success', req.url))
}
