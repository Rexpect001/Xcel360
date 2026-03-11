export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()
    const events = await prisma.event.findMany({ orderBy: { date: 'asc' } })
    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const event = await prisma.event.create({ data: body })
    return NextResponse.json(event, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 400 })
  }
}
