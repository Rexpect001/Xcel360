export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Get the design template for an event (eventId omitted = global default).
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const eventId = req.nextUrl.searchParams.get('eventId') || null
    const template = await db.certificateTemplate.findFirst({ where: { eventId } })
    return NextResponse.json({ template })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// Create or update the design template for an event (upsert by eventId).
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const eventId = body.eventId || null

    const fields = {
      certificateType: body.certificateType?.trim() || 'Certificate of Participation',
      backgroundUrl: body.backgroundUrl || null,
      logoUrl: body.logoUrl || null,
      signatureUrl: body.signatureUrl || null,
      signatureName: body.signatureName?.trim() || null,
      signatureTitle: body.signatureTitle?.trim() || null,
      bodyText: body.bodyText?.trim() || null,
    }

    // Manual upsert — eventId is a nullable @unique field, which Prisma cannot
    // target with upsert/findUnique, so we find-then-create/update by hand.
    const existing = await db.certificateTemplate.findFirst({ where: { eventId } })
    const template = existing
      ? await db.certificateTemplate.update({ where: { id: existing.id }, data: fields })
      : await db.certificateTemplate.create({ data: { eventId, ...fields } })

    return NextResponse.json({ ok: true, template })
  } catch (e: any) {
    if (e?.message?.includes('Forbidden') || e?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[certificate template]', e)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}
