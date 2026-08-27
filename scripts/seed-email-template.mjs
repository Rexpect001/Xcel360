/**
 * Seeds the "Xcel360 2026  -  AI Event & Poster Challenge" email template
 * into the EmailTemplate table so it appears in the admin Email → Templates panel.
 *
 * Run once:
 *   node scripts/seed-email-template.mjs
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEMPLATE_NAME = 'Xcel360 2026  -  AI Event & Poster Challenge'

const SUBJECT = "You're Invited! Join Xcel360 2026  -  AI Event & Poster Challenge"

const HTML_BODY = /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xcel360 2026  -  AI Event</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- ── Header ──────────────────────────────────────────── -->
        <tr>
          <td style="background:linear-gradient(135deg,#002b5c 0%,#004ca3 40%,#005fc9 70%,#006fec 100%);padding:48px 40px 40px;text-align:center;">
            <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b9d4fd;">Xcel360 · 2026</p>
            <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.25;">Don't Miss Out  - <br/>Leverage AI at Xcel360 2026</h1>
            <p style="margin:0;font-size:15px;color:#dceafe;line-height:1.5;">Learning · Innovation · Opportunity</p>
          </td>
        </tr>

        <!-- ── Greeting ────────────────────────────────────────── -->
        <tr>
          <td style="padding:40px 40px 0;">
            <p style="margin:0 0 16px;font-size:16px;color:#1f2937;line-height:1.7;">Hello <strong>[First Name]</strong>,</p>
            <p style="margin:0;font-size:16px;color:#374151;line-height:1.7;">
              Thank you for being part of the <strong>Xcel360 community!</strong> We're excited to invite you to
              <strong> Xcel360 2026  -  Leveraging AI in Today's World</strong>, an event packed with learning,
              innovation, and opportunities to showcase your ideas.
            </p>
          </td>
        </tr>

        <!-- ── Divider label ───────────────────────────────────── -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">Here's what you can do as a registered member</p>
          </td>
        </tr>

        <!-- ── Card 1: Main Event ──────────────────────────────── -->
        <tr>
          <td style="padding:0 40px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef5ff;border-radius:12px;border:1px solid #b9d4fd;overflow:hidden;">
              <tr>
                <td style="padding:24px 24px 20px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top;padding-right:16px;">
                        <div style="width:44px;height:44px;background:linear-gradient(135deg,#005fc9,#006fec);border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:44px;font-size:22px;">🎤</div>
                      </td>
                      <td style="vertical-align:top;">
                        <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#002b5c;">Attend the Main Event</p>
                        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                          Learn from AI experts about practical applications for
                          <strong> scholarships, careers, research,</strong> and <strong>productivity</strong>.
                          Get real-world insights you can apply immediately.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top:18px;text-align:center;">
                    <a href="https://thexcel360.com/ai"
                       style="display:inline-block;background:#005fc9;color:#ffffff;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;letter-spacing:0.02em;">
                      Register for the Event →
                    </a>
                    <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">thexcel360.com/ai</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Card 2: Poster Challenge ────────────────────────── -->
        <tr>
          <td style="padding:0 40px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefce8,#fef9c3);border-radius:12px;border:1px solid #fde68a;overflow:hidden;">
              <tr>
                <td style="padding:24px 24px 20px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top;padding-right:16px;">
                        <div style="width:44px;height:44px;background:linear-gradient(135deg,#d97706,#f59e0b);border-radius:10px;text-align:center;line-height:44px;font-size:22px;">🏆</div>
                      </td>
                      <td style="vertical-align:top;">
                        <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#92400e;">Poster Presentation Challenge</p>
                        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                          Submit your abstract, design your poster, and present your project
                          during the <strong>grand finale</strong>.
                        </p>
                        <p style="margin:10px 0 0;display:inline-block;background:#d97706;color:#ffffff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;">
                          Prize Pool: ₦300,000
                        </p>
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top:18px;text-align:center;">
                    <a href="https://edifier.thexcel360.com"
                       style="display:inline-block;background:#d97706;color:#ffffff;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px;letter-spacing:0.02em;">
                      Enroll &amp; Submit →
                    </a>
                    <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">edifier.thexcel360.com</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── How to Join ──────────────────────────────────────── -->
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">How to join</p>

            <!-- Row 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;">
                  <span style="font-size:18px;">🎤</span>
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">
                    <strong>Event Registration:</strong>
                    <a href="https://thexcel360.com/ai" style="color:#005fc9;text-decoration:none;">thexcel360.com/ai</a>
                     -  simply log in and secure your spot.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Row 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;">
                  <span style="font-size:18px;">🏆</span>
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">
                    <strong>Poster Presentation Challenge:</strong>
                    <a href="https://edifier.thexcel360.com" style="color:#005fc9;text-decoration:none;">edifier.thexcel360.com</a>
                     -  enroll and submit your project.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Row 3 -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;">
                  <span style="font-size:18px;">🙌</span>
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">
                    <strong>Volunteer Opportunities:</strong>
                    <a href="https://thexcel360.com/volunteer" style="color:#005fc9;text-decoration:none;">thexcel360.com/volunteer</a>
                     -  support the event as a judge or team member.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Member note ─────────────────────────────────────── -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;padding:18px 20px;">
              <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
                ✅ <strong>You're already set up.</strong> As a registered Xcel360 member, your account is ready to
                enroll for the event and submit your poster. Make the most of your membership by joining this exciting AI experience!
              </p>
            </div>
          </td>
        </tr>

        <!-- ── Closing ─────────────────────────────────────────── -->
        <tr>
          <td style="padding:32px 40px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#374151;line-height:1.7;">
              We can't wait to see your ideas and innovations shine. 🚀
            </p>
            <p style="margin:0;font-size:16px;color:#374151;line-height:1.7;">
              Warm regards,<br/>
              <strong style="color:#002b5c;">The Xcel360 Team</strong>
            </p>
          </td>
        </tr>

        <!-- ── Footer ─────────────────────────────────────────── -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
              <a href="https://thexcel360.com" style="color:#005fc9;text-decoration:none;font-weight:600;">thexcel360.com</a>
              &nbsp;·&nbsp;
              <a href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30" style="color:#005fc9;text-decoration:none;">WhatsApp Channel</a>
              &nbsp;·&nbsp;
              <a href="https://www.youtube.com/@Xcel_360" style="color:#005fc9;text-decoration:none;">YouTube</a>
            </p>
            <p style="margin:0;font-size:12px;color:#d1d5db;">© 2026 Xcel360. Empowering scholars across Africa.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
`.trim()

async function main() {
  const existing = await prisma.emailTemplate.findFirst({ where: { name: TEMPLATE_NAME } })

  if (existing) {
    await prisma.emailTemplate.update({
      where: { id: existing.id },
      data: { subject: SUBJECT, htmlBody: HTML_BODY },
    })
    console.log('✅ Template updated:', TEMPLATE_NAME)
  } else {
    await prisma.emailTemplate.create({
      data: { name: TEMPLATE_NAME, subject: SUBJECT, htmlBody: HTML_BODY },
    })
    console.log('✅ Template created:', TEMPLATE_NAME)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
