export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Return all issued certificates for an email — no OTP (frictionless access).
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const clean = String(email ?? '').trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clean)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    const certs = await db.certificate.findMany({
      where: { email: clean, status: 'ISSUED' },
      orderBy: { issuedAt: 'desc' },
      include: { event: { select: { title: true, date: true } } },
    })

    const certificates = certs.map((c: any) => ({
      certificateId: c.certificateId,
      eventName: c.event?.title ?? '',
      eventDate: c.event?.date ?? null,
      certificateType: c.certificateType,
      issuedAt: c.issuedAt,
      pdfUrl: c.pdfUrl,
      verifyUrl: `/verify/${c.certificateId}`,
    }))

    return NextResponse.json({ ok: true, fullName: certs[0]?.fullName ?? null, certificates })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
