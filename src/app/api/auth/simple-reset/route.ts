import { NextResponse } from 'next/server'

// This endpoint has been disabled for security reasons.
// Password resets require email verification via /api/auth/forgot-password
export async function POST() {
  return NextResponse.json({ error: 'This endpoint is disabled.' }, { status: 410 })
}
