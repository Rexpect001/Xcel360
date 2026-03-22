import nodemailer from 'nodemailer'

function getTransporter() {
  const host = process.env.EMAIL_SERVER_HOST
  const user = process.env.EMAIL_SERVER_USER
  const pass = process.env.EMAIL_SERVER_PASSWORD

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: { user, pass },
  })
}

export async function sendRegistrationConfirmation({
  to,
  fullName,
  eventTitle,
  eventDate,
}: {
  to: string
  fullName: string
  eventTitle: string
  eventDate: Date
}) {
  const transporter = getTransporter()
  if (!transporter) {
    console.log(`[email] Not configured — skipping confirmation to ${to}`)
    return
  }

  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_SERVER_USER
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

  const dateStr = new Date(eventDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px 0;">Registration Confirmed</p>
      <h2 style="color:#111827;margin:0 0 24px 0;font-size:24px;font-weight:700;">You're in, ${fullName}!</h2>

      <div style="background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#1e40af;">${eventTitle}</p>
        <p style="margin:4px 0 0 0;font-size:13px;color:#3b82f6;">${dateStr}</p>
      </div>

      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        Your registration has been received successfully. Keep an eye on your inbox — we'll be sending you joining details and any important information closer to the event date.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 32px 0;">
        If you have any questions in the meantime, simply reply to this email and we'll get back to you.
      </p>

      <a href="${appUrl}/events" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
        View All Events
      </a>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        Warm regards, <strong>The Xcel360 Team</strong><br>
        You're receiving this because you registered for an Xcel360 event.
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: `"Xcel360" <${from}>`,
      to,
      subject: `You're registered for ${eventTitle}!`,
      html,
    })
  } catch (err) {
    console.error('[email] Failed to send confirmation:', err)
  }
}
