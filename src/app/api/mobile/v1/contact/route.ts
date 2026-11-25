export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { POST as contactPOST } from '@/app/api/contact/route'
import { json, preflight } from '@/lib/mobile/http'

export const OPTIONS = preflight

/** POST { name, email, subject?, message } -> the website's contact form (same storage and email). */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const forward = new NextRequest(req.url, { method: 'POST', headers: req.headers, body })
  const res = await contactPOST(forward)
  const data = await res.json().catch(() => ({}))
  return json({ kind: 'contact', ...data }, res.status)
}
