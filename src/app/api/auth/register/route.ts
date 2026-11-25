export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { REFERRAL_COOKIE } from '@/lib/referrals'
import { AccountExistsError, createAccount, registerSchema } from '@/lib/accounts'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Please check the form.' }, { status: 400 })
  }

  try {
    const referral = typeof body.ref === 'string' ? body.ref.trim().toUpperCase() : req.cookies.get(REFERRAL_COOKIE)?.value
    const user = await createAccount(parsed.data, { referral, via: 'web' })
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, message: 'Account created successfully.' }, { status: 201 })
  } catch (error) {
    if (error instanceof AccountExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
