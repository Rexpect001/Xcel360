export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            level: true,
            school: true,
            department: true,
            bio: true,
            whatsappNumber: true,
            targetCountries: true,
            targetFields: true,
            notifyEmail: true,
            notifyInApp: true,
          },
        },
        _count: {
          select: {
            savedOpps: true,
            applications: true,
            notifications: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const activityLog = await db.activityLog.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceName: true,
        details: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user, activityLog })
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
