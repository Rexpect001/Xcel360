export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/activity-logger'

const VALID_ROLES = ['USER', 'EDITOR', 'MODERATOR', 'MENTOR', 'MANAGER', 'ADMIN'] as const
type ValidRole = typeof VALID_ROLES[number]

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { role } = body

  if (!role || !VALID_ROLES.includes(role as ValidRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 }
    )
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, role: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.id },
    data: { role: role as ValidRole },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  await logActivity({
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role,
    action: 'ASSIGN_ROLE',
    resource: 'user',
    resourceId: targetUser.id,
    resourceName: targetUser.email,
    details: `Changed role from ${targetUser.role} to ${role}`,
    req,
  })

  return NextResponse.json(updatedUser)
}
