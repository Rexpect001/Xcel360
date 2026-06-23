export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Public verification endpoint — no auth. Returns the minimum needed to
// confirm a certificate's authenticity and status.
export async function GET(
  _req: Request,
  { params }: { params: { certificateId: string } },
) {
  try {
    const cert = await db.certificate.findUnique({
      where: { certificateId: params.certificateId },
      include: { event: { select: { title: true, date: true } } },
    })

    if (!cert) {
      return NextResponse.json({ found: false }, { status: 404 })
    }

    return NextResponse.json({
      found: true,
      certificateId: cert.certificateId,
      holder: cert.fullName,
      eventName: cert.event?.title ?? '',
      eventDate: cert.event?.date ?? null,
      certificateType: cert.certificateType,
      issueDate: cert.issuedAt,
      institution: cert.institution,
      course: cert.course,
      status: cert.status, // ISSUED | REVOKED
      valid: cert.status === 'ISSUED',
    })
  } catch {
    return NextResponse.json({ found: false }, { status: 500 })
  }
}
