export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getOwnDraft, getOwnDraftAnyState, restoreDraft, trashDraft } from '@/lib/writing-drafts'

const MAX_OUTPUT = 20000

async function load(id: string) {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) return { error: NextResponse.json({ error: 'Please sign in.' }, { status: 401 }) }
  const draft = await getOwnDraft(userId, id)
  if (!draft) return { error: NextResponse.json({ error: 'Draft not found' }, { status: 404 }) }
  return { draft }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { draft, error } = await load(params.id)
  if (error) return error
  return NextResponse.json({ draft })
}

/** Save edits, rename, or swap back to the previous version. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { draft, error } = await load(params.id)
  if (error) return error

  const body = await req.json().catch(() => ({}))
  if (body.restorePrevious === true) {
    if (!draft.previousOutput) return NextResponse.json({ error: 'There is no previous version.' }, { status: 400 })
    const updated = await prisma.writingDraft.update({
      where: { id: draft.id },
      data: { output: draft.previousOutput, previousOutput: draft.output },
      select: { output: true, updatedAt: true },
    })
    return NextResponse.json({ output: updated.output, updatedAt: updated.updatedAt, hasPrevious: true })
  }

  const data: { output?: string; title?: string } = {}
  if (typeof body.output === 'string') data.output = body.output.slice(0, MAX_OUTPUT)
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 140)
  if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })

  const updated = await prisma.writingDraft.update({ where: { id: draft.id }, data, select: { updatedAt: true } })
  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt })
}

/**
 * Delete: an active draft moves to Trash (kept 30 days, restorable).
 * A draft already in Trash is deleted for good.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const draft = await getOwnDraftAnyState(userId, params.id)
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  if (draft.trashedAt) {
    await prisma.writingDraft.delete({ where: { id: draft.id } })
    return NextResponse.json({ ok: true, state: 'deleted' })
  }
  await trashDraft(draft.id)
  return NextResponse.json({ ok: true, state: 'trashed' })
}

/** Restore a draft from Trash. It gets a fresh 30-day active window. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (body.action !== 'restore') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  const draft = await getOwnDraftAnyState(userId, params.id)
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  if (draft.trashedAt) await restoreDraft(draft.id)
  return NextResponse.json({ ok: true })
}
