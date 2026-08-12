import { put } from '@vercel/blob'

/**
 * Renders the OG image for an opportunity by calling /api/og, then uploads
 * the resulting PNG to Vercel Blob storage.  Returns the permanent CDN URL,
 * or null if generation/upload fails (callers should fall back gracefully).
 *
 * The Blob path is deterministic (keyed on the opportunity ID) so calling
 * this twice for the same opportunity simply overwrites the previous file.
 */
export async function generateAndStoreOpImage(
  recordId: string,
  type: 'scholarship' | 'job' | 'internship' | 'event',
  appUrl: string
): Promise<string | null> {
  try {
    const ogUrl = `${appUrl}/api/og?id=${recordId}&type=${type}&simple=true`
    const res = await fetch(ogUrl)
    if (!res.ok || !res.body) return null

    const blob = await put(
      `op-images/${recordId}.png`,
      res.body,
      { access: 'public', contentType: 'image/png', addRandomSuffix: false }
    )
    return blob.url
  } catch {
    return null
  }
}
