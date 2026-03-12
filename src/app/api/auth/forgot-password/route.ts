export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/security/email-verification'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (email) {
      try {
        const token = await generatePasswordResetToken(email)
        if (token) {
          await sendPasswordResetEmail(email, token)
        }
      } catch (innerError) {
        console.error('[FORGOT PASSWORD ERROR]', innerError)
      }
    }

    // Always return success to avoid email enumeration
    return NextResponse.json(
      { message: 'If that email exists, a reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]', error)
    return NextResponse.json(
      { message: 'If that email exists, a reset link has been sent.' },
      { status: 200 }
    )
  }
}
