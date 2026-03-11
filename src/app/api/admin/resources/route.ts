export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET() {
  try {
    await requireAdmin()
    const resources = await db.resource.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
    return NextResponse.json(resources)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const resource = await db.resource.create({
      data: {
        title: body.title,
        description: body.description || null,
        category: body.category,
        fileUrl: body.fileUrl,
        filename: body.filename || null,
        published: body.published ?? true,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
      },
    })
    return NextResponse.json(resource, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
