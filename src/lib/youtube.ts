/**
 * Latest videos from the Xcel360 YouTube channel via the public RSS feed
 * (no API key needed). Cached for 6 hours by Next's fetch cache.
 */
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID ?? 'UCQDkfEJrTQR6h6dAV1OUlvg'

export interface ChannelVideo {
  id: string
  title: string
  published: string
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export async function getChannelVideos(limit = 15): Promise<ChannelVideo[]> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, {
      next: { revalidate: 21600 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const entries = xml.split('<entry>').slice(1)
    return entries.slice(0, limit).flatMap((e) => {
      const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
      const title = e.match(/<title>([^<]+)<\/title>/)?.[1]
      const published = e.match(/<published>([^<]+)<\/published>/)?.[1] ?? ''
      return id && title ? [{ id, title: decode(title), published }] : []
    })
  } catch (err) {
    console.error('[youtube] feed failed', err)
    return []
  }
}

export const CHANNEL_URL = 'https://www.youtube.com/@Xcel_360'
