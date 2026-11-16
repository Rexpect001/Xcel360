import { revalidatePath } from 'next/cache'

/**
 * Public listing pages are ISR-cached (revalidate = 300). Call this after any
 * opportunity create/update/delete so new posts show up immediately instead of
 * waiting up to five minutes for the cache to expire. This clears the cache
 * on the server that handled the write; other replicas catch up within 5 min.
 */
export function revalidateOpportunityPages() {
  try {
    for (const p of ['/', '/opportunities', '/scholarships', '/jobs', '/internships']) {
      revalidatePath(p)
    }
    revalidatePath('/opportunities/[id]', 'page')
    revalidatePath('/jobs/[id]', 'page')
    revalidatePath('/internships/[id]', 'page')
  } catch (err) {
    // Never fail a write because cache invalidation failed
    console.error('[revalidate-opportunities]', err)
  }
}
