/**
 * Creates the DRAFT "What's new on Xcel360" campaign (Nov 2026) for everyone:
 * active users + newsletter subscribers + contacts, de-duplicated, without
 * test/seed accounts. Nothing is sent here. It appears in Admin -> Email.
 *
 *   node scripts/create-update-campaign.mjs            (create, prints the id)
 *   node scripts/create-update-campaign.mjs --users     (registered users only)
 *
 * Then send through Gmail (about 480 a day, resumable):
 *   node scripts/send-campaign-gmail.mjs <id> --test you@example.com
 *   node scripts/send-campaign-gmail.mjs <id> --dry
 *   node scripts/send-campaign-gmail.mjs <id> --yes
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) {
        let v = m[2].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        process.env[m[1]] = v
      }
    }
  } catch {}
}
const here = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
loadEnv(here('../.env.local'))
loadEnv(here('../.env'))

const SUBJECT = "What's new on Xcel360: your smarter dashboard and 100 free AI credits"
const HTML = readFileSync(here('./emails/whats-new-2026-11.html'), 'utf8')
const TEXT = `Hi [First Name],

We've been working behind the scenes to serve you better, and the new Xcel360 is now live. Here is what you can do today:

- Scholarships matched to you: your dashboard shows your top 12 scholarships, ranked by how well they fit your profile.
- Track every application: save a scholarship and move it from Saved to Submitted to Result, with a document checklist and deadline reminders.
- AI writing tools: draft an academic or job CV, a statement of purpose, cover letters and emails to supervisors, tailored to the scholarship you choose. Drafts are saved for 30 days.
- 100 free AI credits: every account comes with 100 free credits. Invite a friend with your personal link and you both get 50 more.
- Launchpad and mentorship: test a startup idea, or book time with an advisor.

Open your dashboard: https://thexcel360.com/dashboard
New here? Create your free account: https://thexcel360.com/signup

There is a lot more coming, and we can't wait for you to see it. Thank you for growing with us.

Warm regards,
The Xcel360 Team`

const usersOnly = process.argv.includes('--users')
const valid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const skip = (e) => e.endsWith('@example.com') || e === 'admin@xcel360.com'

const prisma = new PrismaClient()
async function main() {
  const emails = new Set()
  const add = (rows) => rows.forEach((r) => { const e = String(r.email || '').trim().toLowerCase(); if (valid(e) && !skip(e)) emails.add(e) })
  add(await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { email: true } }))
  if (!usersOnly) {
    add(await prisma.emailSubscriber.findMany({ select: { email: true } }))
    add(await prisma.contact.findMany({ select: { email: true } }))
  }
  const recipients = [...emails]
  const c = await prisma.emailCampaign.create({
    data: {
      subject: SUBJECT,
      htmlBody: HTML,
      textBody: TEXT,
      audience: usersOnly ? 'users' : 'both',
      provider: 'gmail',
      status: 'DRAFT',
      recipients: JSON.stringify(recipients),
      totalCount: recipients.length,
      dailyLimit: 480,
    },
    select: { id: true },
  })
  console.log(`Draft campaign created: ${c.id}`)
  console.log(`Subject: ${SUBJECT}`)
  console.log(`Recipients: ${recipients.length}${usersOnly ? ' (users only)' : ' (users + subscribers + contacts)'}`)
  console.log(`\nNext:\n  node scripts/send-campaign-gmail.mjs ${c.id} --test you@example.com\n  node scripts/send-campaign-gmail.mjs ${c.id} --dry\n  node scripts/send-campaign-gmail.mjs ${c.id} --yes`)
}
main().catch((e) => { console.error('Error:', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
