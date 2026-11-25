export const dynamic = 'force-dynamic'
import { rotateMobileSession } from '@/lib/mobile/auth'
import { fail, ok, preflight, readJson } from '@/lib/mobile/http'

export const OPTIONS = preflight

/** POST { refreshToken } -> { data: new session }. 401 means the app must sign in again. */
export async function POST(req: Request) {
  const body = await readJson(req)
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : ''
  if (!refreshToken) return fail('Please sign in again.', 401)
  const session = await rotateMobileSession(refreshToken)
  return session ? ok(session) : fail('Please sign in again.', 401)
}
