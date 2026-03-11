import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { itemId, completed } = await req.json()

    // Verify ownership
    const app = await prisma.application.findUnique({ where: { id: params.id } })
    if (!app || app.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: { completed },
    })

    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
