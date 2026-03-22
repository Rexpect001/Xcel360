export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET — fetch questions for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const questions = await db.eventQuestion.findMany({
      where: { eventId: params.id },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(questions)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// PUT — replace all questions for an event (full sync)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const questions: { label: string; type: string; options: string[]; required: boolean; sortOrder: number }[] =
      await req.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    // Delete all existing questions (answers cascade)
    await db.eventQuestion.deleteMany({ where: { eventId: params.id } })

    // Re-create in order
    const created = await Promise.all(
      questions.map((q, i) =>
        db.eventQuestion.create({
          data: {
            eventId: params.id,
            label: q.label.trim(),
            type: q.type ?? 'text',
            options: q.options ?? [],
            required: q.required ?? false,
            sortOrder: i,
          },
        })
      )
    )

    return NextResponse.json(created)
  } catch (err) {
    console.error('[questions PUT]', err)
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
