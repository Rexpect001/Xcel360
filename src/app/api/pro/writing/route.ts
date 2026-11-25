export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { handleWritingRequest, type WritingBody } from '@/lib/writing-request'

/** Website writing tools. The logic is shared with the mobile app in lib/writing-request. */
export async function POST(req: NextRequest) {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to use the writing tools.' }, { status: 401 })
  }

  let body: WritingBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const result = await handleWritingRequest({ id: userId, email: session.user.email, role: session.user.role }, body)
  return NextResponse.json(result.body, { status: result.status })
}
