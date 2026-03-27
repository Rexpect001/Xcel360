export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Temporary diagnostic endpoint — remove after fixing auth
export async function GET() {
  const checks: Record<string, string> = {}

  // Check env vars (non-sensitive)
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL ? '✓ set' : '✗ MISSING'
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? '✓ set' : '✗ MISSING'
  checks.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? '✓ set' : '✗ MISSING'
  checks.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ? '✓ set' : '✗ MISSING'
  checks.DATABASE_URL = process.env.DATABASE_URL ? '✓ set' : '✗ MISSING'

  // Check DB connectivity
  try {
    await prisma.user.count()
    checks.DB_CONNECTION = '✓ connected'
  } catch (e: any) {
    checks.DB_CONNECTION = `✗ FAILED: ${e.message}`
  }

  // Check Account table
  try {
    const count = await prisma.account.count()
    checks.ACCOUNT_TABLE = `✓ exists (${count} records)`
  } catch (e: any) {
    checks.ACCOUNT_TABLE = `✗ FAILED: ${e.message}`
  }

  return NextResponse.json(checks)
}
