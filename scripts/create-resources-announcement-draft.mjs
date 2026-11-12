/**
 * Creates a DRAFT campaign announcing the October 2026 resource pack to every
 * registered user, newsletter subscriber and imported contact (deduplicated).
 * The draft appears in Admin → Email; nothing is sent until you click Send there.
 *
 *   node scripts/create-resources-announcement-draft.mjs            # create draft
 *   node scripts/create-resources-announcement-draft.mjs --preview  # write .tmp/resources-announcement.html only
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const SITE = 'https://thexcel360.com'
const LINK = `${SITE}/resources?utm_source=email&utm_medium=broadcast&utm_campaign=resource-pack-2026-10`
const SUBJECT = 'New free templates: sample SOPs, a PhD cover letter and interview prep'
const PREHEADER = '9 new downloads on Xcel360 to help with your next application. Free, no sign-up needed.'

const GROUPS = [
  ['Real application samples', [
    ['Sample SOP: PhD in Materials Science & Engineering', 'how to link your coursework and research to a clear doctoral interest'],
    ['Sample SOP: Erasmus Mundus MESPOM (Environmental Policy)', 'opening with a real problem from your own community'],
    ['Sample Cover Letter: PhD Position in Biology (Wageningen)', 'adaptable for any advertised PhD vacancy'],
    ['Sample Academic CV: PhD in Cognitive Science', 'how to lay out publications, research and grants'],
  ]],
  ['Worksheets and email templates', [
    ['Research Proposal Planner', 'turn an idea into a focused, feasible research question'],
    ['Recommendation Letter Request Kit', 'what to send a referee, and how to ask'],
    ['Application Fee Waiver Request', 'a short email you can adapt, plus a checklist'],
  ]],
  ['Interview preparation', [
    ['Common Graduate Admissions Interview Questions', 'what Master\'s and PhD panels usually ask'],
    ['Graduate Interview Practice Sheet', 'prepare clear answers backed by real examples'],
  ]],
]

const groupHtml = GROUPS.map(([heading, items]) => `
        <tr><td style="padding:20px 40px 4px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2266B1;">${heading}</p>
          ${items.map(([t, d]) => `
          <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#1f2937;"><strong>${t}</strong><br/><span style="color:#4b5563;">${d}</span></p>`).join('')}
        </td></tr>`).join('')

const HTML_BODY = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>New free resources on Xcel360</title></head>
<body style="margin:0;padding:0;background-color:#f3f6fa;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${PREHEADER}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f6fa;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#2266B1;padding:28px 40px;text-align:left;">
        <img src="${SITE}/brand/xcel-white.png" alt="Xcel360" height="32" style="display:block;height:32px;width:auto;border:0;" />
      </td></tr>
      <tr><td style="padding:32px 40px 8px;">
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">9 new free resources for your applications</h1>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1f2937;">Dear [First Name],</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1f2937;">We've added nine new downloads to the Xcel360 Resources page. They include real statements of purpose, a CV and a cover letter written by applicants, plus worksheets for the parts of an application that people often leave too late: referee requests, fee waivers and interviews.</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#1f2937;">All of them are free PDFs. You don't need an account to download them.</p>
      </td></tr>
      ${groupHtml}
      <tr><td align="center" style="padding:24px 40px 8px;">
        <a href="${LINK}" style="display:inline-block;background:#2266B1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;">Browse the resources</a>
      </td></tr>
      <tr><td style="padding:20px 40px 32px;">
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4b5563;">A tip: use the samples to see how an argument is built, then write your own in your own words. Admissions committees can spot a copied statement.</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#1f2937;">Best wishes with your applications,<br/><strong>Johnson Alabi</strong><br/>Coordinator, Xcel360</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

const TEXT_BODY = `Dear [First Name],

We've added nine new downloads to the Xcel360 Resources page. They include real statements of purpose, a CV and a cover letter written by applicants, plus worksheets for the parts of an application that people often leave too late: referee requests, fee waivers and interviews.

All of them are free PDFs. You don't need an account to download them.

${GROUPS.map(([h, items]) => `${h.toUpperCase()}\n${items.map(([t, d]) => `- ${t}: ${d}`).join('\n')}`).join('\n\n')}

Browse the resources: ${LINK}

A tip: use the samples to see how an argument is built, then write your own in your own words. Admissions committees can spot a copied statement.

Best wishes with your applications,
Johnson Alabi
Coordinator, Xcel360`

if (process.argv.includes('--preview')) {
  mkdirSync(here('../.tmp'), { recursive: true })
  writeFileSync(here('../.tmp/resources-announcement.html'), HTML_BODY.replace(/\[First Name\]/g, 'Johnson'))
  console.log('Preview written to .tmp/resources-announcement.html')
  process.exit(0)
}

const prisma = new PrismaClient()
async function main() {
  const [users, subs, contacts] = await Promise.all([
    prisma.user.findMany({ select: { email: true } }),
    prisma.emailSubscriber.findMany({ select: { email: true } }),
    prisma.contact.findMany({ select: { email: true } }),
  ])
  const recipients = Array.from(new Set(
    [...users, ...subs, ...contacts].map(r => (r.email || '').toLowerCase().trim()).filter(e => e.includes('@'))
  ))
  const c = await prisma.emailCampaign.create({ data: {
    subject: SUBJECT, htmlBody: HTML_BODY, textBody: TEXT_BODY, audience: 'none', provider: 'sendchamp',
    status: 'DRAFT', dailyLimit: 100, recipients: JSON.stringify(recipients),
    manualRecipients: '[]', ccRecipients: '[]', bccRecipients: '[]', attachments: '[]',
    totalCount: recipients.length, sentCount: 0,
  }})
  console.log(`DRAFT created. id: ${c.id}  recipients: ${c.totalCount} (users ${users.length}, subscribers ${subs.length}, contacts ${contacts.length}, before dedupe)`)
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
