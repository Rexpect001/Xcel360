import { sendMail } from '@/lib/mailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

// Escape HTML then linkify URLs and preserve line breaks for plain-text blocks.
function renderMeetingDetails(raw: string): string {
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#004ca3;word-break:break-all;">$1</a>')
    .replace(/\n/g, '<br>')
}

export async function sendRegistrationConfirmation({
  to,
  fullName,
  eventTitle,
  eventDate,
  meetingDetails,
}: {
  to: string
  fullName: string
  eventTitle: string
  eventDate: Date
  meetingDetails?: string | null
}) {
  const dateStr = new Date(eventDate).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const meetingBlock = meetingDetails?.trim()
    ? `<div style="background:#eef5ff;border:1px solid #b9d4fd;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#004ca3;text-transform:uppercase;letter-spacing:0.05em;">Joining Details</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">${renderMeetingDetails(meetingDetails.trim())}</p>
      </div>`
    : ''

  await sendMail({
    to,
    subject: `You're registered for ${eventTitle}!`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#004ca3,#005fc9);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px 0;">Registration Confirmed</p>
      <h2 style="color:#111827;margin:0 0 24px 0;font-size:24px;font-weight:700;">You're in, ${fullName}!</h2>
      <div style="background:#eff6ff;border-left:4px solid #004ca3;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#004ca3;">${eventTitle}</p>
        <p style="margin:4px 0 0 0;font-size:13px;color:#005fc9;">${dateStr}</p>
      </div>
      ${meetingBlock}
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
        ${meetingBlock
          ? 'Your registration is confirmed. Save the joining details above  -  we look forward to seeing you there.'
          : "Your registration has been received. We'll send joining details closer to the event date."}
      </p>
      <a href="${APP_URL}/events" style="display:inline-block;background:linear-gradient(135deg,#004ca3,#005fc9);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">View All Events</a>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Warm regards, <strong>The Xcel360 Team</strong></p>
    </div>
  </div>
</body></html>`,
  })
}

export async function sendDeadlineReminderEmail({
  to,
  name,
  opportunityTitle,
  opportunityId,
  daysLeft,
}: {
  to: string
  name: string
  opportunityTitle: string
  opportunityId: string
  daysLeft: number
}) {
  const urgency = daysLeft <= 7 ? '#dc2626' : '#d97706'
  const label = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`

  await sendMail({
    to,
    subject: `Deadline ${label}: ${opportunityTitle}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#004ca3,#005fc9);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px 0;">Deadline Reminder</p>
      <h2 style="color:#111827;margin:0 0 24px 0;font-size:22px;font-weight:700;">Hi ${name}, don't miss this!</h2>
      <div style="background:#fef2f2;border-left:4px solid ${urgency};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${opportunityTitle}</p>
        <p style="margin:6px 0 0 0;font-size:14px;font-weight:700;color:${urgency};">Deadline closes ${label}</p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">You saved this opportunity  -  make sure you submit before it closes.</p>
      <a href="${APP_URL}/opportunities/${opportunityId}" style="display:inline-block;background:linear-gradient(135deg,#004ca3,#005fc9);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">View Opportunity</a>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">The Xcel360 Team · <a href="${APP_URL}/dashboard/notifications" style="color:#9ca3af;">Manage notifications</a></p>
    </div>
  </div>
</body></html>`,
  })
}

export async function sendNewOpportunityEmail({
  to,
  name,
  opportunityTitle,
  opportunityId,
  hostOrg,
  country,
  matchScore,
  matchReasons,
}: {
  to: string
  name: string
  opportunityTitle: string
  opportunityId: string
  hostOrg: string
  country: string
  matchScore?: number
  matchReasons?: string[]
}) {
  const matchBlock =
    matchScore !== undefined
      ? `<p style="margin:12px 0 0 0;font-size:13px;color:#047857;"><strong>${matchScore}% match</strong>${matchReasons && matchReasons.length > 0 ? ` · ${matchReasons.join(', ')}` : ''}</p>`
      : ''

  await sendMail({
    to,
    subject: `${matchScore !== undefined ? `${matchScore}% match — ` : ''}New opportunity matches your profile: ${opportunityTitle}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#004ca3,#005fc9);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px 0;">New Match</p>
      <h2 style="color:#111827;margin:0 0 24px 0;font-size:22px;font-weight:700;">Hi ${name}, this one's for you</h2>
      <div style="background:#eff6ff;border-left:4px solid #004ca3;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#004ca3;">${opportunityTitle}</p>
        <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">${hostOrg} · ${country}</p>${matchBlock}
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">A new opportunity matching your profile just posted. Check the details and apply before the deadline.</p>
      <a href="${APP_URL}/opportunities/${opportunityId}" style="display:inline-block;background:linear-gradient(135deg,#004ca3,#005fc9);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">View Opportunity</a>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">The Xcel360 Team · <a href="${APP_URL}/dashboard/notifications" style="color:#9ca3af;">Manage notifications</a></p>
    </div>
  </div>
</body></html>`,
  })
}
