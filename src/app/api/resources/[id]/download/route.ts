export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = prisma as any
    const resource = await db.resource.findUnique({ where: { id: params.id } })
    if (!resource || !resource.fileUrl) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Increment download counter
    await db.resource.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
    })

    // Proxy the file so the blob URL is never exposed to the browser.
    // Must buffer as ArrayBuffer  -  streaming upstream.body through a serverless
    // function can corrupt binary files (docx, pdf, etc.)
    const upstream = await fetch(resource.fileUrl)
    if (!upstream.ok) {
      return NextResponse.json({ error: 'File fetch failed' }, { status: 502 })
    }

    const buffer = await upstream.arrayBuffer()
    const filename = resource.filename ?? resource.title ?? 'download'
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'

    // Use RFC 5987 encoding for the filename so special chars and spaces are safe
    const encodedFilename = encodeURIComponent(filename).replace(/'/g, '%27')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '\\"')}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = prisma as any
    await db.resource.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
