import { revalidatePath } from 'next/cache'

/**
 * Public listing pages are ISR-cached (revalidate = 3600). Call this after any
 * opportunity create/update/delete so new posts show up immediately instead of
 * waiting up to an hour for the cache to expire.
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
