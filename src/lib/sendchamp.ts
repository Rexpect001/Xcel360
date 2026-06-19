const SENDCHAMP_BASE = 'https://api.sendchamp.com/api/v1'

interface ScRecipient { email: string; name?: string }
interface ScFrom { email: string; name: string }
interface ScPayload {
  to: ScRecipient[]
  from: ScFrom
  subject: string
  html_body: string
}

export function sendchampConfigured(): boolean {
  return !!process.env.SENDCHAMP_API_KEY?.trim()
}

/** Send a single email via SendChamp. Returns true on success. */
export async function sendchampOne(opts: {
  to: string
  toName: string
  from: ScFrom
  subject: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SENDCHAMP_API_KEY
  if (!apiKey) return { ok: false, error: 'SENDCHAMP_API_KEY not set' }

  const payload: ScPayload = {
    to: [{ email: opts.to, name: opts.toName }],
    from: opts.from,
    subject: opts.subject,
    html_body: opts.html,
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
    if (!res.ok || (data.status && data.status >= 400)) {
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
