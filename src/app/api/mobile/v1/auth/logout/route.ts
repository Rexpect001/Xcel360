export const dynamic = 'force-dynamic'
import { revokeMobileSession } from '@/lib/mobile/auth'
import { ok, preflight, readJson } from '@/lib/mobile/http'

export const OPTIONS = preflight

/** POST { refreshToken } -> revokes it. Always succeeds, so sign-out works offline-first. */
export async function POST(req: Request) {
  const body = await readJson(req)
  if (typeof body?.refreshToken === 'string' && body.refreshToken) {
    await revokeMobileSession(body.refreshToken).catch(() => {})
  }
  return ok({ signedOut: true })
}
