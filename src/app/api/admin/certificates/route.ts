export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { extractInstitutionCourse } from '@/lib/certificates/generate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Per-event participant roster merged with their certificate status.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const eventId = req.nextUrl.searchParams.get('eventId')
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const [registrations, certificates, template] = await Promise.all([
      db.eventRegistration.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        include: { answers: { include: { question: true } } },
      }),
      db.certificate.findMany({ where: { eventId } }),
      db.certificateTemplate.findFirst({ where: { eventId } }),
    ])

    const certByReg: Record<string, any> = {}
    for (const c of certificates) certByReg[c.registrationId] = c

    const participants = registrations.map((r: any) => {
      const { institution, course } = extractInstitutionCourse(r)
      const cert = certByReg[r.id]
      return {
        registrationId: r.id,
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        institution,
        course,
        registeredAt: r.createdAt,
        certificate: cert
          ? {
              id: cert.id,
              certificateId: cert.certificateId,
              status: cert.status,
              pdfUrl: cert.pdfUrl,
              certificateType: cert.certificateType,
              issuedAt: cert.issuedAt,
              emailSentAt: cert.emailSentAt,
            }
          : null,
      }
    })

    return NextResponse.json({
      event: { id: event.id, title: event.title, date: event.date, type: event.type },
      participants,
      template,
      stats: {
        total: registrations.length,
        issued: certificates.filter((c: any) => c.status === 'ISSUED').length,
        revoked: certificates.filter((c: any) => c.status === 'REVOKED').length,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
