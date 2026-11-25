export const dynamic = 'force-dynamic'
import { ok, preflight } from '@/lib/mobile/http'
import { STARTUP_TOOL_ORDER, TOOL_ORDER, WRITING_TOOLS } from '@/lib/writing-tools'
import { creditsFor } from '@/lib/billing'

export const OPTIONS = preflight

/** GET the writing and Launchpad tools (names, credit cost). Public, like the tools page. */
export async function GET() {
  const summary = (id: (typeof TOOL_ORDER)[number] | (typeof STARTUP_TOOL_ORDER)[number]) => ({
    id, name: WRITING_TOOLS[id].name, tagline: WRITING_TOOLS[id].tagline, credits: creditsFor(id),
  })
  return ok({ writing: TOOL_ORDER.map(summary), launchpad: STARTUP_TOOL_ORDER.map(summary) })
}
