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

    // Proxy the file so the blob URL is never exposed to the browser
    const upstream = await fetch(resource.fileUrl)
    if (!upstream.ok) {
      return NextResponse.json({ error: 'File fetch failed' }, { status: 502 })
    }

    const filename = resource.filename ?? resource.title ?? 'download'
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
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
