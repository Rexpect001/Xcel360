/**
 * Local SendChamp sender for a campaign - mirrors src/lib/email-utils.runCampaignSend.
 *
 *   node scripts/send-campaign.mjs <campaignId> --test you@example.com   # send ONE test, no state change
 *   node scripts/send-campaign.mjs <campaignId> --yes                    # FULL send (resumable)
 *   node scripts/send-campaign.mjs <campaignId> --yes --from "Xcel360 <noreply@thexcel360.com>"
 */
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'
import { readFileSync } from 'node:fs'
import { createHmac } from 'node:crypto'

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
const SC_BASE = 'https://api.sendchamp.com/api/v1'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

// ---- args ----
const args = process.argv.slice(2)
const campaignId = args[0]
const testIdx = args.indexOf('--test')
const testEmail = testIdx !== -1 ? args[testIdx + 1] : null
const confirmed = args.includes('--yes')
const fromIdx = args.indexOf('--from')
const FROM = fromIdx !== -1 ? args[fromIdx + 1] : (process.env.EMAIL_FROM ?? 'Xcel360 <noreply@thexcel360.com>')

function parseFrom(from) {
  const m = from.match(/^(.+?)\s*<(.+?)>$/)
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: 'Xcel360', email: from.trim() }
}
function unsubToken(email) { return createHmac('sha256', process.env.NEXTAUTH_SECRET ?? 'fallback-secret').update(email.toLowerCase()).digest('hex') }
function unsubUrl(email) { return `${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken(email)}` }
function personalize(text, email, map) { return text.replace(/\[First Name\]/gi, map.get(email.toLowerCase()) ?? 'Scholar') }
function withFooter(text, email) { return text + `\n\n────────────────────────────────────\nTo unsubscribe: ${unsubUrl(email)}` }
function withHtmlFooter(html, email) {
  const footer = `\n<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:12px;color:#9ca3af;text-align:center;">You're receiving this because you signed up at Xcel360.&nbsp;<a href="${unsubUrl(email)}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a></div>`
  return html.includes('</body>') ? html.replace('</body>', `${footer}</body>`) : html + footer
}
async function resendSend({ to, from, subject, html }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({ from: `${from.name} <${from.email}>`, to, subject, html })
    if (error) return { ok: false, error: JSON.stringify(error), raw: error }
    return { ok: true, raw: data }
  } catch (e) { return { ok: false, error: e.message ?? 'Resend error' } }
}

async function scSend({ to, toName, from, subject, text }) {
  const apiKey = process.env.SENDCHAMP_API_KEY
  if (!apiKey) return { ok: false, error: 'SENDCHAMP_API_KEY not set' }
  const payload = { subject, to: [{ email: to, name: toName || to.split('@')[0] }], from, message_body: { type: 'text', value: text } }
  try {
    const res = await fetch(`${SC_BASE}/email/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.status === 'failed') return { ok: false, error: data.message ?? `HTTP ${res.status}`, raw: data }
    return { ok: true, raw: data }
  } catch (e) { return { ok: false, error: e.message ?? 'Network error' } }
}

async function buildFirstNameMap(emails) {
  const lower = emails.map(e => e.toLowerCase())
  const map = new Map()
  const users = await prisma.user.findMany({ where: { email: { in: lower } }, select: { email: true, name: true } })
  for (const u of users) if (u.name) map.set(u.email.toLowerCase(), u.name.trim().split(/\s+/)[0])
  const miss1 = lower.filter(e => !map.has(e))
  if (miss1.length) {
    const cs = await prisma.contact.findMany({ where: { email: { in: miss1 } }, select: { email: true, name: true } })
    for (const c of cs) if (c.name && !map.has(c.email)) map.set(c.email, c.name.trim().split(/\s+/)[0])
  }
  const miss2 = lower.filter(e => !map.has(e))
  if (miss2.length) {
    const rs = await prisma.eventRegistration.findMany({ where: { email: { in: miss2 } }, select: { email: true, fullName: true }, distinct: ['email'] })
    for (const r of rs) if (r.fullName && !map.has(r.email.toLowerCase())) map.set(r.email.toLowerCase(), r.fullName.trim().split(/\s+/)[0])
  }
  return map
}

async function main() {
  if (!campaignId) { console.error('Usage: node scripts/send-campaign.mjs <campaignId> [--test email | --yes]'); process.exit(1) }
  const c = await prisma.emailCampaign.findUnique({ where: { id: campaignId } })
  if (!c) { console.error(`Campaign ${campaignId} not found`); process.exit(1) }
  const from = parseFrom(FROM)
  console.log(`Campaign: ${c.subject}`)
  console.log(`From:     ${from.name} <${from.email}>`)
  console.log(`Provider: ${c.provider} | recipients: ${c.totalCount} | sentCount: ${c.sentCount}`)

  // ---- TEST MODE ----
  if (testEmail) {
    const map = await buildFirstNameMap([testEmail])
    console.log(`\nSending TEST (${c.provider}) to ${testEmail} …`)
    let r
    if (c.provider === 'resend') {
      const html = withHtmlFooter(personalize(c.htmlBody ?? '', testEmail, map), testEmail)
      r = await resendSend({ to: testEmail, from, subject: c.subject, html })
    } else {
      const text = withFooter(personalize(c.textBody ?? '', testEmail, map), testEmail)
      r = await scSend({ to: testEmail, toName: map.get(testEmail.toLowerCase()) ?? 'Johnson', from, subject: c.subject, text })
    }
    console.log(r.ok ? '✅ TEST accepted' : `❌ TEST failed: ${r.error}`)
    if (r.raw) console.log('   response:', JSON.stringify(r.raw).slice(0, 300))
    return
  }

  // ---- FULL SEND ----
  if (!confirmed) { console.error('\nRefusing to send: pass --yes to confirm the full broadcast.'); process.exit(2) }
  const recipients = JSON.parse(c.recipients ?? '[]')
  const total = recipients.length
  let cursor = c.sentCount ?? 0
  await prisma.emailCampaign.update({ where: { id: c.id }, data: { status: 'SENDING' } })

  const unsubs = await prisma.emailUnsubscribe.findMany({ where: { email: { in: recipients.map(e => e.toLowerCase()) } }, select: { email: true } })
  const unsubSet = new Set(unsubs.map(u => u.email.toLowerCase()))

  let sent = 0, failed = 0
  const slice = recipients.slice(cursor)
  const map = await buildFirstNameMap(slice)
  for (let i = 0; i < slice.length; i++) {
    const to = slice[i]
    if (unsubSet.has(to.toLowerCase())) { cursor++; continue }
    const text = withFooter(personalize(c.textBody ?? '', to, map), to)
    const r = await scSend({ to, toName: map.get(to.toLowerCase()) ?? 'Scholar', from, subject: c.subject, text })
    if (r.ok) { sent++; await prisma.emailLog.create({ data: { campaignId: c.id, to, status: 'SENT' } }) }
    else { failed++; await prisma.emailLog.create({ data: { campaignId: c.id, to, status: 'FAILED', error: String(r.error).slice(0, 300) } }) }
    cursor++
    if (cursor % 25 === 0 || i === slice.length - 1) {
      await prisma.emailCampaign.update({ where: { id: c.id }, data: { sentCount: cursor } })
      process.stdout.write(`\r  progress: ${cursor}/${total}  (sent ${sent}, failed ${failed})   `)
    }
  }
  await prisma.emailCampaign.update({ where: { id: c.id }, data: { sentCount: cursor, status: cursor >= total ? 'COMPLETED' : 'SENDING' } })
  console.log(`\n\n✅ Done. sent=${sent} failed=${failed} total=${total}`)
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
