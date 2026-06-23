export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Revoke or reinstate a certificate. Body: { id, revoke: boolean }
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { id, revoke = true } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const cert = await db.certificate.findUnique({ where: { id } })
    if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })

    const updated = await db.certificate.update({
      where: { id },
      data: revoke
        ? { status: 'REVOKED', revokedAt: new Date() }
        : { status: 'ISSUED', revokedAt: null },
    })

    await logActivity({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: 'UPDATE',
      resource: 'certificate',
      resourceId: cert.certificateId,
      resourceName: cert.fullName,
      details: revoke ? 'Certificate revoked' : 'Certificate reinstated',
      req,
    })

    return NextResponse.json({ ok: true, status: updated.status })
  } catch (e: any) {
    if (e?.message?.includes('Forbidden') || e?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 })
  }
}
