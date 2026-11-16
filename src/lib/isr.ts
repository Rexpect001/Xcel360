import { unstable_cache } from 'next/cache'

/**
 * Public pages are ISR-cached: each page exports `revalidate = 300` (Next
 * needs that literal in the page file), is served from the Next cache, and
 * sends `s-maxage=300, stale-while-revalidate=60` so a CDN can cache it too.
 *
 * The container image is built WITHOUT database credentials, so pages that are
 * prerendered during `next build` cannot reach the database and render empty.
 * The same happens at runtime if the database has a blip. In both cases the
 * data loader calls `shortenCacheAfterDbFailure`, which drops that render's
 * cache life to 30 seconds - the empty page is replaced on the next request
 * after that, instead of being served (and CDN-cached) for five minutes.
 */
export const DB_FAILURE_REVALIDATE = 30

// unstable_cache lowers the current page's revalidate to its own value when it
// is called during a render. The callback itself does nothing.
const lowerPageRevalidate = unstable_cache(async () => true, ['isr-db-failure'], {
  revalidate: DB_FAILURE_REVALIDATE,
})

export async function shortenCacheAfterDbFailure(scope: string, error: unknown) {
  // At build time there is no database on purpose; keep the log to one line.
  const message = error instanceof Error ? error.message.split('\n').filter(Boolean).pop() : String(error)
  console.error(`[${scope}] database read failed, caching this render for ${DB_FAILURE_REVALIDATE}s: ${message}`)
  try {
    await lowerPageRevalidate()
  } catch {
    // Outside a page render there is nothing to shorten.
  }
}
