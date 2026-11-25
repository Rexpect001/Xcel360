export const dynamic = 'force-dynamic'
import type { NextRequest } from 'next/server'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'
import { checkCredentials } from '@/lib/accounts'
import { createMobileSession } from '@/lib/mobile/auth'
import { fail, ok, preflight, readJson } from '@/lib/mobile/http'

export const OPTIONS = preflight

/** POST { email, password } -> { data: session } */
export async function POST(req: NextRequest) {
  const limited = await rateLimitMiddleware('auth')(req)
  if (limited) return fail('Too many sign-in attempts. Please wait a minute and try again.', 429)

  const body = await readJson(req)
  const email = typeof body?.email === 'string' ? body.email : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email.trim() || !password) return fail('Enter your email and password.')

  const result = await checkCredentials(email, password)
  if (!result.ok) return fail(result.error, 401)
  return ok(await createMobileSession(result.user))
}
