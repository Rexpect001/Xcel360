export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const MAX_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000

// Verify an OTP and, on success, return all issued certificates for the email.
export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    const clean = String(email ?? '').trim().toLowerCase()
    const cleanCode = String(code ?? '').trim()

    if (!clean || !/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ error: 'Enter the 6-digit code' }, { status: 400 })
    }

    const otp = await db.certificateOtp.findFirst({
      where: {
        email: clean,
        code: cleanCode,
        consumed: false,
        expiresAt: { gt: new Date() },
        createdAt: { gt: new Date(Date.now() - MAX_ATTEMPTS_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    await db.certificateOtp.update({ where: { id: otp.id }, data: { consumed: true } })

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
