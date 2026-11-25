export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { POST as forgotPOST } from '@/app/api/auth/forgot-password/route'
import { json, preflight } from '@/lib/mobile/http'

export const OPTIONS = preflight

/**
 * POST { email } -> emails a reset link (the website's forgot-password flow).
 * Always the same answer, so it never reveals whether an email has an account.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await forgotPOST(new NextRequest(req.url, { method: 'POST', headers: req.headers, body }))
  const data = await res.json().catch(() => ({}))
  return json(data, res.status)
}
