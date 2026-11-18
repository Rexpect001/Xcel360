import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getAuth } from '@/lib/auth'

// Who may use the poster page at /post:
//  1. Anyone with a poster password. POSTER_PASSWORDS holds named entries,
//     e.g. POSTER_PASSWORDS=samuel:pass1,john:pass2. The name is what the
//     post is credited to (poster stats, admin activity page). Falls back to
//     TOOLS_PASSWORD, the variable the standalone tool used, so the same value
//     can be copied across. Bare passwords (no colon) count as "anonymous".
//  2. Signed-in staff with one of POSTER_ROLES - no password needed.

const POSTER_ROLES = ['ADMIN', 'MANAGER', 'EDITOR']

function parseEntries(): Array<{ name: string; password: string }> {
  const stored = process.env.POSTER_PASSWORDS ?? process.env.TOOLS_PASSWORD ?? ''
  return stored
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => {
      const colon = e.indexOf(':')
      if (colon > 0) return { name: e.slice(0, colon).trim(), password: e.slice(colon + 1).trim() }
      return { name: 'anonymous', password: e }
    })
    .filter((e) => e.password.length > 0)
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// ── Brute-force guard: 8 wrong passwords per IP per 15 minutes ──────────────
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 8
const failures = new Map<string, { count: number; first: number }>()

function clientIp(req: NextRequest): string {
  return req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function isLockedOut(ip: string): boolean {
  const f = failures.get(ip)
  if (!f) return false
  if (Date.now() - f.first > WINDOW_MS) { failures.delete(ip); return false }
  return f.count >= MAX_FAILS
}

function recordFailure(ip: string) {
  const f = failures.get(ip)
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(ip, { count: 1, first: Date.now() })
  else f.count++
}

export type PosterAuth =
  | { ok: true; poster: string; via: 'password' | 'session' }
  | { ok: false; status: 401 | 429; error: string }

export async function resolvePoster(req: NextRequest, password: unknown): Promise<PosterAuth> {
  // Signed-in staff first
  const session = await getAuth().catch(() => null)
  if (session && POSTER_ROLES.includes(session.user.role)) {
    const name = session.user.name?.trim() || session.user.email.split('@')[0]
    return { ok: true, poster: name.slice(0, 100), via: 'session' }
  }

  const ip = clientIp(req)
  if (isLockedOut(ip)) {
    return { ok: false, status: 429, error: 'Too many wrong attempts. Try again in 15 minutes.' }
  }

  if (typeof password === 'string' && password.length > 0) {
    const match = parseEntries().find((e) => safeEqual(e.password, password))
    if (match) return { ok: true, poster: match.name, via: 'password' }
    recordFailure(ip)
  }

  return { ok: false, status: 401, error: 'Wrong password' }
}
