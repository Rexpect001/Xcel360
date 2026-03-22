export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const event = await prisma.event.findUnique({ where: { id: params.id } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    const [registrations, questions] = await Promise.all([
      db.eventRegistration.findMany({
        where: { eventId: params.id },
        orderBy: { createdAt: 'desc' },
        include: {
          answers: {
            include: { question: true },
            orderBy: { question: { sortOrder: 'asc' } },
          },
        },
      }),
      db.eventQuestion.findMany({
        where: { eventId: params.id },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const format = req.nextUrl.searchParams.get('format')

    if (format === 'csv') {
      const qLabels = questions.map((q: any) => q.label)
      const baseHeaders = ['Full Name', 'Email', 'Phone', 'Registered At']
      const headers = [...baseHeaders, ...qLabels]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = registrations.map((r: any) => {
        const answerMap: Record<string, string> = {}
        for (const a of r.answers) answerMap[a.questionId] = a.answer

        const baseValues = [
          r.fullName,
          r.email,
          r.phone ?? '',
          new Date(r.createdAt).toISOString(),
        ]
        const customValues = questions.map((q: any) => answerMap[q.id] ?? '')
        return [...baseValues, ...customValues]
      })

      const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
      const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
      const filename = `registrations-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({ event, registrations, questions })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
