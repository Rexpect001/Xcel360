const SENDCHAMP_BASE = 'https://api.sendchamp.com/api/v1'

export interface ScFrom { email: string; name: string }

export function sendchampConfigured(): boolean {
  return !!process.env.SENDCHAMP_API_KEY?.trim()
}

function wrapHtml(html: string): string {
  if (/^\s*<!DOCTYPE/i.test(html)) return html
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body>${html}</body></html>`
}

/** Send a single email via SendChamp. */
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
      type: 'html',
      value: wrapHtml(opts.html),
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
