export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN")

    const { newPassword } = await req.json()
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashed },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
