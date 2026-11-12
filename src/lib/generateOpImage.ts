import { putBlob } from '@/lib/blob-storage'

/**
 * Renders the OG image for an opportunity by calling /api/og, then uploads
 * the resulting PNG to Azure Blob Storage. Returns the permanent URL,
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
    const secret = process.env.CRON_SECRET
    if (!secret) return null
    const res = await fetch(ogUrl, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    if (!res.ok || !res.body) return null

    const blob = await putBlob(
      `op-images/${recordId}.png`,
      res.body,
      { contentType: 'image/png', addRandomSuffix: false }
    )
    return blob.url
  } catch {
    return null
  }
}
