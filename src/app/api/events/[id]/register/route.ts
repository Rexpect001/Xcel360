export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendRegistrationConfirmation } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id, published: true },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const body = await req.json()
    const { fullName, email, phone, answers } = body

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    // Validate required custom questions
    if (answers && typeof answers === 'object') {
      const questions = await db.eventQuestion.findMany({ where: { eventId: params.id } })
      for (const q of questions) {
        if (q.required && !answers[q.id]?.trim()) {
          return NextResponse.json({ error: `"${q.label}" is required` }, { status: 400 })
        }
      }
    }

    const registration = await db.eventRegistration.create({
      data: {
        eventId: params.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
      },
    })

    // Save custom answers
    if (answers && typeof answers === 'object') {
      const answerEntries = Object.entries(answers) as [string, string][]
      for (const [questionId, answer] of answerEntries) {
        if (answer?.trim()) {
          await db.eventAnswer.create({
            data: {
              registrationId: registration.id,
              questionId,
              answer: answer.trim(),
            },
          })
        }
      }
    }

    // Send confirmation email (non-blocking)
    sendRegistrationConfirmation({
      to: registration.email,
      fullName: registration.fullName,
      eventTitle: event.title,
      eventDate: event.date,
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: registration.id }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
