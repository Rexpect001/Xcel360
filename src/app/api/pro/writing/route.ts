export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Prisma } from '@prisma/client'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { WRITING_TOOLS, isToolId } from '@/lib/writing-tools'
import { finishAiRun, reserveAiRun } from '@/lib/ai-usage'
import { PROMPT_VERSION, WRITING_MODEL, draftTitle, runWritingTool } from '@/lib/writing-engine'
import { getOpportunityContext, getOwnDraft, pruneDrafts } from '@/lib/writing-drafts'
import { getBalance, hasUnlimitedCredits, refundCredit, spendCredit } from '@/lib/credits'

interface Body {
  tool?: unknown
  inputs?: unknown
  opportunityId?: unknown
  draftId?: unknown
  /** "generate" (default) or "fix" (repair the issues found in `draft`). */
  action?: unknown
  draft?: unknown
}

export async function POST(req: NextRequest) {
  const session = await getAuth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to use the writing tools.' }, { status: 401 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (!isToolId(body.tool)) {
    return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
  }
  const toolId = body.tool
  const inputs = body.inputs && typeof body.inputs === 'object' && !Array.isArray(body.inputs) ? (body.inputs as Record<string, unknown>) : {}
  const fixing = body.action === 'fix'
  if (fixing && (typeof body.draft !== 'string' || !body.draft.trim())) {
    return NextResponse.json({ error: 'There is no draft to fix.' }, { status: 400 })
  }

  // A draft id only counts if it belongs to this user and this tool
  const existing = await getOwnDraft(userId, body.draftId).catch(() => null)
  const draft = existing && existing.tool === toolId ? existing : null
  const opportunity = toolId.startsWith('startup-') ? null : await getOpportunityContext(body.opportunityId ?? draft?.opportunityId)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Writing tools are not configured yet. Please try again later.' }, { status: 503 })
  }

  const runId = await reserveAiRun(userId, fixing ? `${toolId}:fix` : toolId)
  if (!runId) {
    return NextResponse.json({ error: 'You have reached the AI usage limit. Please try again later.' }, { status: 429 })
  }

  // One credit per new draft. Fixing issues on an existing draft is free.
  const unlimited = hasUnlimitedCredits(session.user.role)
  const charged = !fixing && !unlimited
  if (fixing && !draft) {
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'fix-without-draft' }, false).catch(console.error)
    return NextResponse.json({ error: 'Open a saved draft to fix its issues.' }, { status: 400 })
  }
  let paid = true
  try {
    paid = !charged || (await spendCredit(userId, runId, WRITING_TOOLS[toolId].name))
  } catch (error) {
    console.error('[pro/writing] credit check failed', error)
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'credit-error' }, false).catch(console.error)
    return NextResponse.json({ error: 'We could not check your credits. Please try again shortly.' }, { status: 503 })
  }
  if (!paid) {
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'no-credits' }, false).catch(console.error)
    return NextResponse.json(
      { error: 'You have used all your credits. Buy a credit pack to keep drafting.', code: 'NO_CREDITS', credits: 0 },
      { status: 402 }
    )
  }
  const refund = () => (charged ? refundCredit(userId, runId).catch(console.error) : Promise.resolve())

  try {
    const result = await runWritingTool({
      client: new Anthropic({ apiKey }),
      toolId,
      inputs,
      opportunity,
      fix: fixing ? { draft: String(body.draft).slice(0, 12000) } : undefined,
    })

    await finishAiRun(
      runId,
      {
        model: WRITING_MODEL,
        promptVersion: PROMPT_VERSION,
        outcome: result.outcome ?? (result.ok ? 'ok' : 'error'),
        ...(result.usage && {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          estimatedUsd: Number(((result.usage.inputTokens * 2 + result.usage.outputTokens * 10) / 1_000_000).toFixed(6)),
        }),
      },
      result.ok
    ).catch(console.error)

    if (!result.ok || !result.text) {
      await refund()
      return NextResponse.json({ error: result.error ?? 'Something went wrong.' }, { status: result.status ?? 500 })
    }

    // Save the draft. A save failure must not lose the text the user just paid a run for.
    let draftId: string | null = null
    let hasPrevious = false
    const cleanInputs = Object.fromEntries(
      Object.entries(inputs).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, (v as string).slice(0, 5000)])
    )
    const data = {
      title: draftTitle(toolId, cleanInputs, opportunity),
      inputs: cleanInputs as Prisma.InputJsonValue,
      output: result.text,
      checks: (result.checks ?? []) as unknown as Prisma.InputJsonValue,
      promptVersion: PROMPT_VERSION,
      opportunityId: opportunity?.id ?? null,
    }
    try {
      if (draft) {
        // Keep what the user had (their edited text when fixing) as the previous version
        const previousOutput = fixing ? String(body.draft).slice(0, 20000) : draft.output
        await prisma.writingDraft.update({ where: { id: draft.id }, data: { ...data, previousOutput } })
        draftId = draft.id
        hasPrevious = true
      } else {
        const created = await prisma.writingDraft.create({ data: { ...data, userId, tool: toolId }, select: { id: true } })
        draftId = created.id
        await pruneDrafts(userId).catch(console.error)
      }
    } catch (error) {
      console.error('[pro/writing] could not save draft', error)
    }

    const credits = unlimited ? null : await getBalance(userId).catch(() => null)
    return NextResponse.json({ text: result.text, truncated: result.truncated, checks: result.checks, draftId, hasPrevious, credits })
  } catch (error) {
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'error' }, false).catch(console.error)
    await refund()
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'The writing service is busy. Please try again in a minute.' }, { status: 429 })
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[pro/writing] API error', error.status, error.message)
      return NextResponse.json({ error: 'The writing service had a problem. Please try again.' }, { status: 502 })
    }
    console.error('[pro/writing] failed', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
