const SENDCHAMP_BASE = 'https://api.sendchamp.com/api/v1'

export interface ScFrom { email: string; name: string }

export function sendchampConfigured(): boolean {
  return !!process.env.SENDCHAMP_API_KEY?.trim()
}

/** Convert HTML email to clean plain text for SendChamp delivery. */
function htmlToPlainText(html: string): string {
  return html
    // Remove style and script blocks entirely
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Preserve links as "label (url)"
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, url, label) => {
      const text = label.replace(/<[^>]+>/g, '').trim()
      return text ? `${text} ( ${url} )` : url
    })
    // Block-level elements → newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|tr|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/?(td|th)[^>]*>/gi, '  ')
    .replace(/<\/?(li)[^>]*>/gi, '\n• ')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#x2019;/g, "'")
    // Collapse excessive whitespace / blank lines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Send a single email via SendChamp (plain text — most reliable delivery). */
export async function sendchampOne(opts: {
  to: string
  toName: string
  from: ScFrom
  subject: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SENDCHAMP_API_KEY
  if (!apiKey) return { ok: false, error: 'SENDCHAMP_API_KEY not set' }

  const payload = {
    subject: opts.subject,
    to: [{ email: opts.to, name: opts.toName || opts.to.split('@')[0] }],
    from: opts.from,
    message_body: {
      type: 'text',
      value: htmlToPlainText(opts.html),
    },
  }

  try {
    const res = await fetch(`${SENDCHAMP_BASE}/email/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.status === 'failed') {
      return { ok: false, error: data.message ?? `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message ?? 'Network error' }
  }
}

/** Parse "Name <email@domain.com>" into { name, email }. */
export function parseFromString(from: string): ScFrom {
  const match = from.match(/^(.+?)\s*<(.+?)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: 'Xcel360', email: from.trim() }
}
