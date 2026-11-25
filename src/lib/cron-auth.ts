import { timingSafeEqual } from 'crypto'

/**
 * Cron routes are called by the Azure Logic App scheduler with
 * `Authorization: Bearer <CRON_SECRET>`. They are exempt from the login
 * middleware, so this check is their only protection: it refuses every request
 * when CRON_SECRET is not configured, and compares in constant time.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) return false
  const header = req.headers.get('authorization') ?? ''
  const given = Buffer.from(header)
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
