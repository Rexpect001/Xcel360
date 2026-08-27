import prisma from '@/lib/prisma'
import { sendMail } from '@/lib/mailer'
import { rankOpportunities, profileCompleteness } from '@/lib/matching'
import { formatDate } from '@/lib/utils'

const DAILY_LIMIT = 100
const STATE_KEY = 'weekly_digest_state'
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

interface DigestState {
  week: string
  cursor: number
  completed: boolean
}

type DigestMatch = {
  id: string
  title: string
  hostOrg: string
  country: string
  fundingType: string
  deadline: Date | null
  score: number
  reasons: string[]
}

function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function readState(): Promise<DigestState> {
  const currentWeek = weekKey()
  const setting = await prisma.siteSetting.findUnique({ where: { key: STATE_KEY } })
  if (!setting) return { week: currentWeek, cursor: 0, completed: false }

  try {
    const parsed = JSON.parse(setting.value) as DigestState
    if (parsed.week === currentWeek) return parsed
  } catch {
    // Reset below when stored state is malformed.
  }
  return { week: currentWeek, cursor: 0, completed: false }
}

async function writeState(state: DigestState) {
  await prisma.siteSetting.upsert({
    where: { key: STATE_KEY },
    update: { value: JSON.stringify(state) },
    create: { key: STATE_KEY, value: JSON.stringify(state) },
  })
}

function digestHtml(name: string, matches: DigestMatch[], completeness: number): string {
  const items = matches.map((opp) => {
    const url = `${BASE}/opportunities/${opp.id}`
    return `
      <tr>
        <td style="padding:18px 0;border-bottom:1px solid #e5e7eb;">
          <a href="${url}" style="font-size:16px;font-weight:700;color:#002b5c;text-decoration:none;">${escapeHtml(opp.title)}</a>
          <p style="margin:6px 0;color:#4b5563;font-size:14px;line-height:1.5;">${escapeHtml(opp.hostOrg)} • ${escapeHtml(opp.country)} • ${escapeHtml(opp.fundingType)}</p>
          <p style="margin:0;color:#64748b;font-size:13px;">Deadline: ${escapeHtml(formatDate(opp.deadline))} | Match: ${opp.score}% | ${escapeHtml(opp.reasons.join(', '))}</p>
        </td>
      </tr>`
  }).join('')

  const profileNote = completeness < 100
    ? `<p style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;padding:12px 14px;border-radius:10px;font-size:13px;">Your profile is ${completeness}% complete. Add your study level, countries, and fields to improve next week's matches.</p>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#002b5c,#005fc9);padding:30px 34px;">
      <h1 style="margin:0;color:#ffffff;font-size:23px;">Your Xcel360 opportunity matches</h1>
      <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">A quick weekly roundup based on your profile.</p>
    </div>
    <div style="padding:30px 34px;">
      <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.6;">Hi ${escapeHtml(name || 'there')}, here are the strongest opportunities we found for you this week.</p>
      ${profileNote}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:10px;">${items}</table>
      <div style="text-align:center;margin-top:28px;">
        <a href="${BASE}/dashboard" style="display:inline-block;background:#004ca3;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:11px;font-weight:700;font-size:14px;">Open my dashboard</a>
      </div>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">You are receiving this because email notifications are enabled in your Xcel360 profile.</p>
    </div>
  </div>
</body></html>`
}

export async function sendWeeklyDigestBatch(limit = DAILY_LIMIT) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, reason: 'RESEND_API_KEY is not configured', sent: 0, processed: 0 }
  }

  const state = await readState()
  if (state.completed) return { ok: true, week: state.week, sent: 0, processed: 0, completed: true }

  const where = { status: 'ACTIVE' as const, profile: { notifyEmail: true } }
  const total = await prisma.user.count({ where })
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    skip: state.cursor,
    take: Math.min(limit, DAILY_LIMIT),
    select: {
      id: true,
      email: true,
      name: true,
      profile: {
        select: {
          level: true,
          targetCountries: true,
          targetFields: true,
          courseOfStudy: true,
          department: true,
          degree: true,
          graduationYear: true,
        },
      },
    },
  })

  const opportunities = await prisma.opportunity.findMany({
    where: { status: 'OPEN', deadline: { gt: new Date() }, category: 'SCHOLARSHIP' },
    orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
    take: 80,
  })

  let sent = 0
  let processed = 0
  const errors: Array<{ email: string; error: string }> = []

  for (const user of users) {
    processed += 1
    const matches = rankOpportunities(opportunities, user.profile, 6)
    if (matches.length === 0) continue

    try {
      await sendMail({
        to: user.email,
        subject: 'Your weekly Xcel360 scholarship matches',
        html: digestHtml(user.name ?? '', matches, profileCompleteness(user.profile)),
      })
      sent += 1
    } catch (err) {
      errors.push({ email: user.email, error: err instanceof Error ? err.message : 'Unknown send error' })
    } finally {
      await writeState({ ...state, cursor: state.cursor + processed, completed: state.cursor + processed >= total })
    }
  }

  const completed = state.cursor + processed >= total
  await writeState({ week: state.week, cursor: state.cursor + processed, completed })

  return { ok: errors.length === 0, week: state.week, sent, processed, total, completed, errors }
}
