export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { verifyPasswordResetToken, clearPasswordResetToken } from '@/lib/security/email-verification'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const userId = await verifyPasswordResetToken(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link.' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    await clearPasswordResetToken(userId)

    return NextResponse.json(
      { message: 'Password reset successfully.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[RESET PASSWORD ERROR]', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
