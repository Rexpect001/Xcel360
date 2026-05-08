import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <noreply@xcel360.com>'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.EMAIL_FROM ?? 'admin@xcel360.com'

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return null
  return new Resend(key)
}

export async function notifyAdminNewUser(name: string, email: string) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New user registered: ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8;margin:0 0 16px">New Registration</h2>
        <p style="color:#374151;margin:0 0 8px"><strong>Name:</strong> ${name}</p>
        <p style="color:#374151;margin:0 0 20px"><strong>Email:</strong> ${email}</p>
        <a href="${process.env.NEXTAUTH_URL ?? 'https://xcel360.com'}/admin/users"
           style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
          View in Admin
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Xcel360 Platform Notification</p>
      </div>
    `,
  })
}

export async function notifyAdminNewApplication(
  userName: string,
  userEmail: string,
  opportunityTitle: string,
) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Application tracked: ${opportunityTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8;margin:0 0 16px">New Application Tracked</h2>
        <p style="color:#374151;margin:0 0 8px"><strong>User:</strong> ${userName} (${userEmail})</p>
        <p style="color:#374151;margin:0 0 20px"><strong>Opportunity:</strong> ${opportunityTitle}</p>
        <a href="${process.env.NEXTAUTH_URL ?? 'https://xcel360.com'}/admin/analytics"
           style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
          View Analytics
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Xcel360 Platform Notification</p>
      </div>
    `,
  })
}
