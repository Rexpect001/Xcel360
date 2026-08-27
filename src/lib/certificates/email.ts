import { sendMail } from '@/lib/mailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

/**
 * Notify a participant that their certificate is ready.
 * Non-throwing flows should wrap this in .catch().
 */
export async function sendCertificateReadyEmail({
  to,
  fullName,
  eventName,
  certificateType,
  downloadUrl,
}: {
  to: string
  fullName: string
  eventName: string
  certificateType: string
  downloadUrl: string
}) {
  await sendMail({
    to,
    subject: 'Your Xcel360 Certificate Is Ready',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#004ca3,#005fc9);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px 0;">Certificate Issued</p>
      <h2 style="color:#111827;margin:0 0 24px 0;font-size:24px;font-weight:700;">Congratulations, ${fullName}!</h2>
      <div style="background:#eff6ff;border-left:4px solid #004ca3;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#004ca3;">${certificateType}</p>
        <p style="margin:4px 0 0 0;font-size:13px;color:#005fc9;">${eventName}</p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
        Your certificate is ready. Click below to view, download, or print it. Each certificate carries a unique QR code so it can be independently verified.
      </p>
      <a href="${downloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#004ca3,#005fc9);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Download Certificate</a>
      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:24px 0 0 0;">
        Or visit <a href="${APP_URL}/certificate" style="color:#004ca3;">${APP_URL}/certificate</a> and enter this email to access all your certificates.
      </p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Warm regards, <strong>The Xcel360 Team</strong></p>
    </div>
  </div>
</body></html>`,
  })
}

export async function sendCertificateOtpEmail({
  to,
  code,
}: {
  to: string
  code: string
}) {
  await sendMail({
    to,
    subject: `Your Xcel360 verification code: ${code}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#004ca3,#005fc9);padding:28px 40px;">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px 0;">Certificate Access</p>
      <h2 style="color:#111827;margin:0 0 20px 0;font-size:20px;font-weight:700;">Your verification code</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px 0;">Enter this code to access your certificates. It expires in 10 minutes.</p>
      <div style="background:#eff6ff;border:1px dashed #004ca3;border-radius:10px;padding:18px;text-align:center;margin-bottom:20px;">
        <span style="font-size:34px;font-weight:800;letter-spacing:8px;color:#004ca3;">${code}</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div style="background:#f8fafc;padding:18px 40px;border-top:1px solid #f1f5f9;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">The Xcel360 Team</p>
    </div>
  </div>
</body></html>`,
  })
}
