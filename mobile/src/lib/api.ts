import Constants from 'expo-constants'
import { clearStoredSession, getStoredSession, storeSession } from '@/lib/storage'
import type { Session } from '@/lib/types'

/** thexcel360.com by default; set EXPO_PUBLIC_API_URL to point at a local server. */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'https://thexcel360.com'
).replace(/\/$/, '')
const BASE = `${API_URL}/api/mobile/v1`

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const OFFLINE = "Can't reach Xcel360. Check your connection and try again."

// One refresh at a time: parallel requests that all hit 401 share it.
let refreshing: Promise<Session | null> | null = null
function refreshSession(): Promise<Session | null> {
  refreshing ??= (async () => {
    const current = await getStoredSession()
    if (!current?.refreshToken) return null
    let res: Response
    try {
      res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      })
    } catch {
      throw new ApiError(OFFLINE, 0) // offline: keep the session, try again later
    }
    if (res.status === 401) {
      // The server refused it (expired, revoked, account blocked): sign out,
      // unless another refresh already replaced the stored session.
      if ((await getStoredSession())?.refreshToken === current.refreshToken) await clearStoredSession()
      return null
    }
    const payload = await res.json().catch(() => null)
    if (!res.ok || !payload?.data?.token) throw new ApiError('Could not reconnect. Please try again.', res.status)
    await storeSession(payload.data)
    return payload.data as Session
  })().finally(() => { refreshing = null })
  return refreshing
}

interface Options { auth?: boolean; retried?: boolean }

/** Calls the mobile API and returns the whole JSON body (`{ data, ...extras }`). */
export async function apiBody<T>(path: string, init: RequestInit = {}, opts: Options = {}): Promise<T> {
  const session = opts.auth === false ? null : await getStoredSession()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`)

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(OFFLINE, 0)
  }
  if (res.status === 401 && session?.refreshToken && !opts.retried) {
    const fresh = await refreshSession()
    if (fresh) return apiBody<T>(path, init, { ...opts, retried: true })
  }
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(payload?.error ?? 'Something went wrong. Please try again.', res.status)
  return payload as T
}

/** Calls the mobile API and returns just `data`. */
export async function api<T>(path: string, init: RequestInit = {}, opts: Options = {}): Promise<T> {
  return (await apiBody<{ data: T }>(path, init, opts)).data
}

export const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })
