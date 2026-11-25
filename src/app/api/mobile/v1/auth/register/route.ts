export const dynamic = 'force-dynamic'
import type { NextRequest } from 'next/server'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'
import { AccountExistsError, createAccount, registerSchema } from '@/lib/accounts'
import { createMobileSession } from '@/lib/mobile/auth'
import { fail, ok, preflight, readJson } from '@/lib/mobile/http'

export const OPTIONS = preflight

/** POST { name, email, password, ref? } -> { data: session }, signed in straight away. */
export async function POST(req: NextRequest) {
  const limited = await rateLimitMiddleware('auth')(req)
  if (limited) return fail('Too many attempts. Please wait a minute and try again.', 429)

  const body = await readJson(req)
  if (!body) return fail('Invalid request.')
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Please check the form.')

  try {
    const referral = typeof body.ref === 'string' && body.ref.trim() ? body.ref.trim().toUpperCase() : null
    const user = await createAccount(parsed.data, { referral, via: 'mobile' })
    return ok(await createMobileSession(user), {}, 201)
  } catch (error) {
    if (error instanceof AccountExistsError) return fail(error.message, 409)
    console.error('[mobile/register]', error)
    return fail('Could not create your account. Please try again.', 500)
  }
}
