/**
 * Creates a DRAFT email campaign for the "Leveraging AI in Today's World" event,
 * targeting everyone registered for it. The draft appears in Admin → Email for
 * review; nothing is sent until you click Send there.
 *
 * Run:  node scripts/create-broadcast-draft.mjs
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'

// ── Load DATABASE_URL from .env.local (the live Supabase DB the app uses) ──────
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
loadEnv(new URL('../.env.local', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
loadEnv(new URL('../.env', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))

const prisma = new PrismaClient()

const EVENT_TITLE_MATCH = 'Leveraging AI in Today'
const SUBJECT = "📌 Today at 4PM WAT — Your join link for Leveraging AI in Today's World"

const HTML_BODY = readFileSync(new URL('../../../Xcel360/events/email-reminders/general-broadcast.html', import.meta.url))
  .toString()
  .replace(/^<!--[\s\S]*?-->\s*/gm, '') // strip the leading subject/preheader comments
  .trim()

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

async function main() {
  const db = prisma

  // Find the event (prefer the one dated around 27 June 2026)
  const events = await db.event.findMany({
    where: { title: { contains: EVENT_TITLE_MATCH, mode: 'insensitive' } },
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: 'desc' },
  })
  if (!events.length) { console.error(`❌ No event matching "${EVENT_TITLE_MATCH}" found.`); process.exit(1) }

  console.log(`\nMatching events:`)
  events.forEach((e, i) => console.log(`  [${i}] ${e.title} — ${new Date(e.date).toDateString()} — ${e._count.registrations} registrations — id=${e.id}`))

  const event = events.find(e => new Date(e.date).toISOString().slice(0, 10) === '2026-06-27') ?? events[0]
  console.log(`\n→ Using: ${event.title} (${new Date(event.date).toDateString()})  id=${event.id}`)

  // Pull distinct registrant emails
  const regs = await db.eventRegistration.findMany({ where: { eventId: event.id }, select: { email: true } })
  const emails = Array.from(new Set(regs.map(r => (r.email ?? '').toLowerCase().trim()).filter(Boolean)))
  console.log(`→ ${emails.length} unique registrant emails`)
  if (!emails.length) { console.error('❌ No registrants with emails. Aborting.'); process.exit(1) }
  if (!HTML_BODY) { console.error('❌ HTML body is empty. Aborting.'); process.exit(1) }

  const campaign = await db.emailCampaign.create({
    data: {
      subject: SUBJECT,
      htmlBody: HTML_BODY,
      textBody: TEXT_BODY,
      audience: 'event',
      provider: 'resend',
      status: 'DRAFT',
      dailyLimit: 100,
      recipients: JSON.stringify(emails),
      manualRecipients: '[]',
      ccRecipients: '[]',
      bccRecipients: '[]',
      attachments: '[]',
      totalCount: emails.length,
      sentCount: 0,
    },
  })

  console.log(`\n✅ DRAFT campaign created.`)
  console.log(`   id:        ${campaign.id}`)
  console.log(`   subject:   ${campaign.subject}`)
  console.log(`   audience:  event (${campaign.totalCount} recipients)`)
  console.log(`   provider:  resend  (free plan sends up to 100/day; use Resume for the rest)`)
  console.log(`\nReview & send it at:  Admin → Email  (it's listed as DRAFT)\n`)
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
