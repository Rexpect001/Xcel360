export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

// Merge every issued certificate PDF for an event into a single downloadable PDF.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const eventId = req.nextUrl.searchParams.get('eventId')
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })

    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const certs = await db.certificate.findMany({
      where: { eventId, status: 'ISSUED', pdfUrl: { not: null } },
      orderBy: { certificateId: 'asc' },
    })

    if (certs.length === 0) {
      return NextResponse.json({ error: 'No issued certificates to download' }, { status: 404 })
    }

    const merged = await PDFDocument.create()
    for (const c of certs) {
      try {
        const res = await fetch(c.pdfUrl)
        if (!res.ok) continue
        const bytes = new Uint8Array(await res.arrayBuffer())
        const src = await PDFDocument.load(bytes)
        const pages = await merged.copyPages(src, src.getPageIndices())
        pages.forEach((p) => merged.addPage(p))
      } catch (e) {
        console.error('[download-all] skip', c.certificateId, e)
      }
    }

    const out = await merged.save()
    const filename = `certificates-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`

    return new NextResponse(Buffer.from(out), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
