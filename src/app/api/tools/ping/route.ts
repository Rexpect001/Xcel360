import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.TOOLS_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized  -  TOOLS_SECRET mismatch' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, message: 'Connected to Xcel360' })
}
