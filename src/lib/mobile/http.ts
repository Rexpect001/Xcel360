import { NextResponse } from 'next/server'
import { getMobileUser, type MobileUser } from '@/lib/mobile/auth'

/**
 * Response helpers for /api/mobile/v1. Every response is `{ data }` or
 * `{ error }`. CORS is open because the API uses bearer tokens, never cookies,
 * and the app's browser preview runs on another origin during development.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
}

export function ok<T>(data: T, extra: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ data, ...extra }, { status, headers: { ...CORS, 'Cache-Control': 'private, no-store' } })
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: CORS })
}

/** A raw JSON body with a status (for results that carry extra fields, e.g. NO_CREDITS). */
export function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { ...CORS, 'Cache-Control': 'private, no-store' } })
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

/** Runs the handler with the signed-in user, or answers 401 so the app refreshes its token. */
export async function withUser(req: Request, handler: (user: MobileUser) => Promise<Response>) {
  const user = await getMobileUser(req)
  if (!user) return fail('Please sign in again.', 401)
  return handler(user)
}
