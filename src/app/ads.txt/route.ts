import { NextResponse } from 'next/server'

// Serves /ads.txt for Google AdSense once NEXT_PUBLIC_ADSENSE_CLIENT is set.
export const dynamic = 'force-static'

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const body = client
    ? `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
    : '# AdSense not configured yet\n'
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } })
}
