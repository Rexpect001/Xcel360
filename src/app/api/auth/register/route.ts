export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { notifyAdminNewUser } from '@/lib/notify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        emailVerified: new Date(), // auto-verify — no email confirmation needed
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true },
    })

    // Notify admin of new registration (non-blocking)
    notifyAdminNewUser(user.name!, user.email!).catch(() => {})

    // Log new registration to ActivityLog (non-blocking)
    prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'SIGNUP',
        resource: 'user',
        resourceId: user.id,
        resourceName: user.email,
        details: 'New account created via credentials',
      },
    }).catch(() => {})

    return NextResponse.json({ ...user, message: 'Account created successfully.' }, { status: 201 })
  } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
