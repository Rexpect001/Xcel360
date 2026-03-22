export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required.' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })

    // Always return success — don't reveal if email exists or not
    if (!user) {
      return NextResponse.json({ message: 'Done.' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    return NextResponse.json({ message: 'Password updated successfully.' })
  } catch (error) {
    console.error('[SIMPLE RESET ERROR]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
