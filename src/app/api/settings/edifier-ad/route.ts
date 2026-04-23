import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const setting = await (prisma as any).siteSetting.findUnique({
    where: { key: 'edifier_ad_enabled' },
  })
  return NextResponse.json({ enabled: setting?.value === 'true' })
}
