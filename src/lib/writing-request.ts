import Anthropic from '@anthropic-ai/sdk'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { WRITING_TOOLS, isToolId } from '@/lib/writing-tools'
import { finishAiRun, reserveAiRun } from '@/lib/ai-usage'
import { PROMPT_VERSION, WRITING_MODEL, draftTitle, runWritingTool } from '@/lib/writing-engine'
import { getOpportunityContext, getOwnDraft, pruneDrafts } from '@/lib/writing-drafts'
import { getBalance, hasUnlimitedCredits, refundCredit, spendCredit } from '@/lib/credits'
import { creditsFor } from '@/lib/billing'

export interface WritingBody {
  tool?: unknown
  inputs?: unknown
  opportunityId?: unknown
  draftId?: unknown
  /** "generate" (default) or "fix" (repair the issues found in `draft`). */
  action?: unknown
  draft?: unknown
}

export interface WritingUser {
  id: string
  email?: string | null
  role?: string | null
}

/** Status code plus JSON body; the website and the mobile API wrap it in their own response. */
export interface WritingResult { status: number; body: Record<string, unknown> }

/**
 * One AI writing run, shared by the website (/api/pro/writing) and the mobile app
 * (/api/mobile/v1/tools/generate): usage limits, credit charge, refund on failure,
 * and saving the draft.
 */
export async function handleWritingRequest(user: WritingUser, body: WritingBody): Promise<WritingResult> {
  const userId = user.id
  if (!isToolId(body.tool)) return { status: 400, body: { error: 'Unknown tool' } }
  const toolId = body.tool
  const inputs = body.inputs && typeof body.inputs === 'object' && !Array.isArray(body.inputs) ? (body.inputs as Record<string, unknown>) : {}
  const fixing = body.action === 'fix'
  if (fixing && (typeof body.draft !== 'string' || !body.draft.trim())) {
    return { status: 400, body: { error: 'There is no draft to fix.' } }
  }

  // A draft id only counts if it belongs to this user and this tool
  const existing = await getOwnDraft(userId, body.draftId).catch(() => null)
  const draft = existing && existing.tool === toolId ? existing : null
  const opportunity = toolId.startsWith('startup-') ? null : await getOpportunityContext(body.opportunityId ?? draft?.opportunityId)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { status: 503, body: { error: 'Writing tools are not configured yet. Please try again later.' } }
  }

  const runId = await reserveAiRun(userId, fixing ? `${toolId}:fix` : toolId, {
    email: user.email,
    role: user.role,
  })
  if (!runId) {
    return { status: 429, body: { error: 'You have reached the AI usage limit. Please try again later.' } }
  }

  // Each tool has its own price (TOOL_CREDITS). Fixing issues on an existing draft is free.
  const unlimited = hasUnlimitedCredits(user.role)
  const charged = !fixing && !unlimited
  if (fixing && !draft) {
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'fix-without-draft' }, false).catch(console.error)
    return { status: 400, body: { error: 'Open a saved draft to fix its issues.' } }
  }
  let paid = true
  try {
    paid = !charged || (await spendCredit(userId, runId, WRITING_TOOLS[toolId].name, creditsFor(toolId)))
  } catch (error) {
    console.error('[writing] credit check failed', error)
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'credit-error' }, false).catch(console.error)
    return { status: 503, body: { error: 'We could not check your credits. Please try again shortly.' } }
  }
  if (!paid) {
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'no-credits' }, false).catch(console.error)
    const balance = await getBalance(userId).catch(() => 0)
    return {
      status: 402,
      body: { error: 'You do not have enough credits for a new draft. Top up or invite a friend to keep drafting.', code: 'NO_CREDITS', credits: balance },
    }
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
      return { status: result.status ?? 500, body: { error: result.error ?? 'Something went wrong.' } }
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
      console.error('[writing] could not save draft', error)
    }

    const credits = unlimited ? null : await getBalance(userId).catch(() => null)
    return { status: 200, body: { text: result.text, truncated: result.truncated, checks: result.checks, draftId, hasPrevious, credits } }
  } catch (error) {
    await finishAiRun(runId, { model: WRITING_MODEL, outcome: 'error' }, false).catch(console.error)
    await refund()
    if (error instanceof Anthropic.RateLimitError) {
      return { status: 429, body: { error: 'The writing service is busy. Please try again in a minute.' } }
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[writing] API error', error.status, error.message)
      return { status: 502, body: { error: 'The writing service had a problem. Please try again.' } }
    }
    console.error('[writing] failed', error)
    return { status: 500, body: { error: 'Something went wrong. Please try again.' } }
  }
}
