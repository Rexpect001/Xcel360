import { NextResponse } from 'next/server'
import { ADSENSE_CLIENT } from '@/lib/ads'

// Serves /ads.txt for Google AdSense.
export const dynamic = 'force-static'

export function GET() {
  const body = `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } })
}
