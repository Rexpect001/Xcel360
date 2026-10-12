import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@thexcel360.com>'

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

export interface MailOptions {
  to: string
  subject: string
  html: string
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const resend = getClient()
  const { error } = await resend.emails.send({ from: FROM, ...opts })
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}
