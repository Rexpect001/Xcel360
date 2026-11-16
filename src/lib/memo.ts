/**
 * Tiny in-process cache for hot, rarely-changing reads (one per server).
 * - Concurrent callers on a miss share one in-flight promise, so a traffic
 *   spike never fans out into hundreds of identical database queries.
 * - If a refresh fails, the last good value keeps being served.
 */
type Entry<T> = { value?: T; expires: number; inflight?: Promise<T> }

const store = new Map<string, Entry<unknown>>()

export const PUBLIC_SETTINGS_CACHE_KEY = 'public-settings'

export async function memo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const entry = (store.get(key) as Entry<T> | undefined) ?? { expires: 0 }
  store.set(key, entry)

  if (entry.value !== undefined && Date.now() < entry.expires) return entry.value
  if (entry.inflight) return entry.value ?? entry.inflight

  entry.inflight = load()
    .then((value) => {
      entry.value = value
      entry.expires = Date.now() + ttlMs
      return value
    })
    .finally(() => {
      entry.inflight = undefined
    })

  if (entry.value !== undefined) {
    // Serve the stale value while refreshing; keep it if the refresh fails.
    entry.inflight.catch((error) => console.error(`[memo:${key}] refresh failed`, error))
    return entry.value
  }
  return entry.inflight
}

export function forget(key: string) {
  store.delete(key)
}
