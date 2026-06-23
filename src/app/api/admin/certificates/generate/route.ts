export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { issueCertificate, resolveTemplate } from '@/lib/certificates/generate'
import { logActivity } from '@/lib/activity-logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

/**
 * Generate (or regenerate) certificates for a set of approved registrations.
 * Body: { eventId, registrationIds: string[], regenerate?: boolean, sendEmail?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const { eventId, registrationIds, regenerate = false, sendEmail = true } = body

    if (!eventId || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: 'eventId and registrationIds are required' }, { status: 400 })
    }

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const registrations = await db.eventRegistration.findMany({
      where: { id: { in: registrationIds }, eventId },
      include: { answers: { include: { question: true } } },
    })

    const template = await resolveTemplate(eventId)

    let generated = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    // Sequential to keep memory + Blob/email throughput predictable.
    for (const reg of registrations) {
      const res = await issueCertificate({ event, registration: reg, template, regenerate, sendEmail })
      if (!res.ok) {
        failed++
        if (res.error) errors.push(`${reg.fullName}: ${res.error}`)
      } else if (res.skipped) {
        skipped++
      } else {
        generated++
      }
    }

    await logActivity({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: regenerate ? 'UPDATE' : 'CREATE',
      resource: 'certificate',
      resourceId: eventId,
      resourceName: event.title,
      details: `Certificates: ${generated} generated, ${skipped} skipped, ${failed} failed`,
      req,
    })

    return NextResponse.json({ ok: true, generated, skipped, failed, errors })
  } catch (e: any) {
    if (e?.message?.includes('Forbidden') || e?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[certificates generate]', e)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
