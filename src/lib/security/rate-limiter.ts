import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'
import { NextRequest, NextResponse } from 'next/server'

// General API rate limiter: 5 requests per second per IP
const apiLimiter = new RateLimiterMemory({
  keyPrefix: 'api',
  points: 5,
  duration: 1, // 1 second
})

// Auth rate limiter: 5 attempts per minute per IP
const authLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 5,
  duration: 60, // 1 minute
})

// Stricter auth limiter for failed attempts (lockout)
const authLockoutLimiter = new RateLimiterMemory({
  keyPrefix: 'auth_lockout',
  points: 5,
  duration: 15 * 60, // 15 minutes lockout after 5 failed attempts
})

export async function rateLimit(
  req: NextRequest,
  type: 'api' | 'auth' | 'auth_lockout' = 'api'
): Promise<{ success: boolean; limiterRes?: RateLimiterRes }> {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const key = `${type}_${ip}`

  try {
    let limiter: RateLimiterMemory
    switch (type) {
      case 'auth':
        limiter = authLimiter
        break
      case 'auth_lockout':
        limiter = authLockoutLimiter
        break
      default:
        limiter = apiLimiter
    }

    const limiterRes = await limiter.consume(key)
    return { success: true, limiterRes }
  } catch (rejRes: any) {
    return { success: false, limiterRes: rejRes }
  }
}

export function rateLimitMiddleware(type: 'api' | 'auth' | 'auth_lockout' = 'api') {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const { success, limiterRes } = await rateLimit(req, type)

    if (!success) {
      const headers: Record<string, string> = {
        'Retry-After': String(limiterRes?.msBeforeNext ? Math.ceil(limiterRes.msBeforeNext / 1000) : 60),
      }

      // Add rate limit headers
      if (limiterRes) {
        headers['X-RateLimit-Limit'] = String(type === 'api' ? 5 : 5)
        headers['X-RateLimit-Remaining'] = String(limiterRes.remainingPoints)
        headers['X-RateLimit-Reset'] = String(new Date(Date.now() + limiterRes.msBeforeNext).toISOString())
      }

      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers }
      )
    }

    return null
  }
}

// Track failed login attempts
export async function trackFailedLogin(req: NextRequest): Promise<boolean> {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const key = `failed_login_${ip}`

  try {
    await authLockoutLimiter.consume(key)
    return false // Not locked out yet
  } catch {
    return true // Locked out
  }
}

// Reset failed login attempts on successful login
export async function resetLoginAttempts(req: NextRequest): Promise<void> {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const key = `failed_login_${ip}`
  
  try {
    await authLockoutLimiter.delete(key)
  } catch {
    // Key might not exist, that's fine
  }
}
