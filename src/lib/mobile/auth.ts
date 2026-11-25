import { createHash, randomBytes } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

/**
 * Mobile app sign-in. The website signs people in with a NextAuth cookie; the
 * app can't use cookies, so it gets:
 *  - an access token (JWT, 15 minutes) sent as `Authorization: Bearer ...`
 *  - a refresh token (random, 30 days) that is swapped for new tokens when the
 *    access token expires. Only its SHA-256 hash is stored, in the Session
 *    table (unused by the website, which keeps its sessions in the JWT cookie).
 * Refresh tokens rotate on every use and are revoked on sign-out.
 */
const ACCESS_TTL_SECONDS = 15 * 60
const REFRESH_TTL_MS = 30 * 864e5
const PREFIX = 'mobile:'
const ISSUER = 'xcel360-mobile'

export interface MobileUser {
  id: string
  email: string
  name: string | null
  role: string
}

function secret() {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET is not configured')
  return new TextEncoder().encode(s)
}

const hashToken = (raw: string) => PREFIX + createHash('sha256').update(raw).digest('hex')

async function accessToken(user: MobileUser) {
  return new SignJWT({ email: user.email, name: user.name, role: user.role, kind: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret())
}

async function sessionPayload(user: MobileUser, refreshToken: string, refreshExpires: Date) {
  return {
    token: await accessToken(user),
    refreshToken,
    expiresAt: new Date(Date.now() + ACCESS_TTL_SECONDS * 1000).toISOString(),
    refreshExpiresAt: refreshExpires.toISOString(),
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

export type MobileSession = Awaited<ReturnType<typeof sessionPayload>>

export async function createMobileSession(user: MobileUser): Promise<MobileSession> {
  const refreshToken = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + REFRESH_TTL_MS)
  await prisma.$transaction([
    // Tidy this user's expired app sessions while we're here
    prisma.session.deleteMany({ where: { userId: user.id, sessionToken: { startsWith: PREFIX }, expires: { lte: new Date() } } }),
    prisma.session.create({ data: { userId: user.id, sessionToken: hashToken(refreshToken), expires } }),
  ])
  return sessionPayload(user, refreshToken, expires)
}

/** Swap a refresh token for a new pair. Returns null when it is unknown, expired, or the account is blocked. */
export async function rotateMobileSession(rawRefreshToken: string): Promise<MobileSession | null> {
  const sessionToken = hashToken(rawRefreshToken)
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: { select: { id: true, email: true, name: true, role: true, status: true } } },
  })
  if (!session || session.expires <= new Date() || (session.user.status && session.user.status !== 'ACTIVE')) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  const next = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + REFRESH_TTL_MS)
  // Conditional update: if two refreshes race, only one wins and the other must sign in again.
  const rotated = await prisma.session.updateMany({
    where: { id: session.id, sessionToken },
    data: { sessionToken: hashToken(next), expires },
  })
  if (rotated.count !== 1) return null
  return sessionPayload(session.user, next, expires)
}

export async function revokeMobileSession(rawRefreshToken: string) {
  await prisma.session.deleteMany({ where: { sessionToken: hashToken(rawRefreshToken) } })
}

/** The signed-in app user from `Authorization: Bearer <access token>`, or null. */
export async function getMobileUser(req: Request): Promise<MobileUser | null> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, algorithms: ['HS256'] })
    if (payload.kind !== 'access' || typeof payload.sub !== 'string') return null
    return {
      id: payload.sub,
      email: String(payload.email ?? ''),
      name: typeof payload.name === 'string' ? payload.name : null,
      role: String(payload.role ?? 'USER'),
    }
  } catch {
    return null
  }
}
