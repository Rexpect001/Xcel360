export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Export the certificate list for an event as CSV.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const eventId = req.nextUrl.searchParams.get('eventId')
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const certs = await db.certificate.findMany({
      where: { eventId },
      orderBy: { certificateId: 'asc' },
    })

    const headers = [
      'Certificate ID', 'Full Name', 'Email', 'Institution', 'Course/Department',
      'Certificate Type', 'Status', 'Issued At', 'Email Sent', 'PDF URL',
    ]
    const rows = certs.map((c: any) => [
      c.certificateId,
      c.fullName,
      c.email,
      c.institution ?? '',
      c.course ?? '',
      c.certificateType,
      c.status,
      new Date(c.issuedAt).toISOString(),
      c.emailSentAt ? new Date(c.emailSentAt).toISOString() : '',
      c.pdfUrl ?? '',
    ])

    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
    const filename = `certificates-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
