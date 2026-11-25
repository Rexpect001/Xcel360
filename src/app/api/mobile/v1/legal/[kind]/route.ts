export const dynamic = 'force-dynamic'
import { fail, ok, preflight } from '@/lib/mobile/http'
import { LEGAL } from '@/content/legal'

export const OPTIONS = preflight

/** GET terms or privacy: the same text as thexcel360.com/terms and /privacy. */
export async function GET(_req: Request, { params }: { params: { kind: string } }) {
  if (params.kind !== 'terms' && params.kind !== 'privacy') return fail('Not found.', 404)
  return ok(LEGAL[params.kind])
}
