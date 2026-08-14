/**
 * 1) Imports the Master Email List CSV into the `contact` table (upsert by email).
 * 2) Creates a DRAFT email campaign (audience=contacts, provider=sendchamp) to that list.
 * Nothing is sent. Review/send happens separately.
 *
 * Run:  node scripts/import-and-draft-master.mjs
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

const prisma = new PrismaClient()

const CSV = here('../.tmp/master-registrants.csv')
const HTML = here('../../../Xcel360/events/email-reminders/general-broadcast.html')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// common domain typos worth flagging (still imported — can't be certain)
const SUSPICIOUS = /@(gmal|gmai|gmsil|gmail\.co$|gmail\.con$|ail|gamil|gmail\.com\.|yaho|outlok|hotmal)/i

const SUBJECT = "📌 Today at 4PM WAT — Your join link for Leveraging AI in Today's World"
const HTML_BODY = readFileSync(HTML, 'utf8').replace(/^<!--[\s\S]*?-->\s*/gm, '').trim()
const TEXT_BODY = `Dear [First Name],

Thank you for registering. Today is the day! We're excited to welcome you to an engaging session on Career Development & Scholarship Pathways, where we'll explore practical ways to leverage Artificial Intelligence for scholarships, research, career growth, and global opportunities.

JOINING DETAILS
Join Zoom Meeting: https://umsystem.zoom.us/j/91459172327?pwd=qMeOcaOMXBXeVwCKJxb6MTdqIebXpY.1
Meeting ID: 914 5917 2327
Passcode: XCEL360
One tap mobile: +1 305 224 1968,,91459172327# US
Dial by location: +1 305 224 1968 US, +1 312 626 6799 US (Chicago), +1 646 876 9923 US (New York)
Find your local number: https://umsystem.zoom.us/u/aejlujyI6d

EVENT DETAILS
Date: Saturday, 27 June 2026
Time: 4:00 PM (WAT)
Please join the meeting 10-15 minutes early to settle in before we begin.

CERTIFICATE OF PARTICIPATION
As a registered participant, you'll be eligible to receive a Certificate of Participation after the event. Attendance will be verified during the session, so be sure to join using the name you registered with.

AI POSTER PRESENTATION COMPETITION
Don't forget that our AI Poster Presentation Competition is also underway!
Theme: What Can You Do With AI?
Showcase an AI-powered project or innovative idea and compete for prizes from our ₦300,000 prize pool.

There's no gatekeeper of knowledge — invite anyone who'd benefit. Every person you bring is a win for them and for you.

See you at 4:00 PM WAT!

Warm regards,
Johnson Alabi
Coordinator, Xcel360
Empowering students beyond limits.`

function parseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  const out = []
  for (let i = 1; i < lines.length; i++) {           // skip header
    const line = lines[i]
    const idx = line.lastIndexOf(',')
    if (idx === -1) continue
    let name = line.slice(0, idx).trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    const email = line.slice(idx + 1).trim()
    out.push({ name, email })
  }
  return out
}

async function main() {
  const raw = parseCsv(readFileSync(CSV, 'utf8'))
  const seen = new Set()
  const valid = []
  const invalid = []
  const suspicious = []
  for (const r of raw) {
    const email = (r.email || '').toLowerCase().trim()
    if (!EMAIL_RE.test(email)) { invalid.push(r.email); continue }
    if (seen.has(email)) continue
    seen.add(email)
    if (SUSPICIOUS.test(email)) suspicious.push(email)
    valid.push({ email, name: r.name || undefined })
  }

  console.log(`\nRows parsed:        ${raw.length}`)
  console.log(`Unique valid:       ${valid.length}`)
  console.log(`Rejected (bad fmt): ${invalid.length}${invalid.length ? ' -> ' + invalid.slice(0, 12).join(', ') + (invalid.length > 12 ? ' …' : '') : ''}`)
  console.log(`Suspicious domains: ${suspicious.length}${suspicious.length ? ' -> ' + suspicious.slice(0, 12).join(', ') + (suspicious.length > 12 ? ' …' : '') : ''}`)

  // Import into contacts (skip existing)
  const before = await prisma.contact.count()
  const res = await prisma.contact.createMany({
    data: valid.map(v => ({ email: v.email, name: v.name, source: 'master-list-import' })),
    skipDuplicates: true,
  })
  const after = await prisma.contact.count()
  console.log(`\nContacts before:    ${before}`)
  console.log(`Contacts inserted:  ${res.count}`)
  console.log(`Contacts now:       ${after}`)

  // Build recipient list = all contact emails (the audience the campaign will send to)
  const contacts = await prisma.contact.findMany({ select: { email: true } })
  const recipients = Array.from(new Set(contacts.map(c => c.email.toLowerCase().trim()).filter(Boolean)))

  const db = prisma
  const campaign = await db.emailCampaign.create({
    data: {
      subject: SUBJECT,
      htmlBody: HTML_BODY,
      textBody: TEXT_BODY,
      audience: 'contacts',
      provider: 'sendchamp',
      status: 'DRAFT',
      dailyLimit: 5000,
      recipients: JSON.stringify(recipients),
      manualRecipients: '[]', ccRecipients: '[]', bccRecipients: '[]', attachments: '[]',
      totalCount: recipients.length,
      sentCount: 0,
    },
  })

  console.log(`\n✅ DRAFT campaign created (SendChamp).`)
  console.log(`   id:         ${campaign.id}`)
  console.log(`   recipients: ${campaign.totalCount}`)
  console.log(`\nNext: TEST send, then full send.\n`)
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
