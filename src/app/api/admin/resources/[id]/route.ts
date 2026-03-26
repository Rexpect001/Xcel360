export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    const resource = await db.resource.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
        ...(body.filename !== undefined && { filename: body.filename }),
        ...(body.fileSize !== undefined && { fileSize: body.fileSize ? Number(body.fileSize) : null }),
        ...(body.fileType !== undefined && { fileType: body.fileType || null }),
        ...(body.isUploaded !== undefined && { isUploaded: body.isUploaded }),
        ...(body.published !== undefined && { published: body.published }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    })
    return NextResponse.json(resource)
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await db.resource.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
