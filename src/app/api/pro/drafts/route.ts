export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { listOwnDrafts } from '@/lib/writing-drafts'

export async function GET() {
  const session = await getAuth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const drafts = await listOwnDrafts(session.user.id)
  return NextResponse.json({ drafts })
}
