export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

/**
 * Stream a certificate PDF through the app so the underlying Vercel Blob
 * storage URL is never exposed to the client. Only ISSUED certificates are
 * served; revoked/missing ones 404.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { certificateId: string } },
) {
  const id = params.certificateId
  const cert = await db.certificate.findUnique({ where: { certificateId: id } })

  if (!cert || cert.status !== 'ISSUED' || !cert.pdfUrl) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const upstream = await fetch(cert.pdfUrl)
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Certificate file unavailable' }, { status: 502 })
  }

  const bytes = Buffer.from(await upstream.arrayBuffer())
  const filename = `Xcel360-Certificate-${id}.pdf`
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      // inline so View/Print work; the page's Download button uses the
      // same-origin `download` attribute to force a save.
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
