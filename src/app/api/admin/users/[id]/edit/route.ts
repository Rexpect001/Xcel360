export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN")
    const { name, email, school, department, level, whatsappNumber, targetCountries, bio } = await req.json()

    // Check email uniqueness if changing
    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: params.id } } })
      if (existing) return NextResponse.json({ error: 'That email is already used by another account.' }, { status: 409 })
    }

    // Update user name/email
    await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
    })

    // Upsert profile fields
    await prisma.profile.upsert({
      where: { userId: params.id },
      create: {
        userId: params.id,
        school: school || null,
        department: department || null,
        level: level || null,
        whatsappNumber: whatsappNumber || null,
        targetCountries: targetCountries || [],
        bio: bio || null,
      },
      update: {
        ...(school !== undefined && { school: school || null }),
        ...(department !== undefined && { department: department || null }),
        ...(level !== undefined && { level: level || null }),
        ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
        ...(targetCountries !== undefined && { targetCountries }),
        ...(bio !== undefined && { bio: bio || null }),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
