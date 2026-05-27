import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// ── Rate limiter ──────────────────────────────────────────────────────────────
// 8 requests/min per IP; after 3 violations → 1-hour hard block
interface RateEntry { count: number; resetAt: number; violations: number; blockedUntil: number }
const rl = new Map<string, RateEntry>()

function checkRateLimit(ip: string): 'ok' | 'limited' | 'blocked' {
  const now = Date.now()
  let e = rl.get(ip)

  if (!e) {
    rl.set(ip, { count: 1, resetAt: now + 60_000, violations: 0, blockedUntil: 0 })
    return 'ok'
  }

  if (e.blockedUntil > now) return 'blocked'

  if (now > e.resetAt) {
    e.count = 1
    e.resetAt = now + 60_000
    return 'ok'
  }

  if (e.count >= 8) {
    e.violations++
    if (e.violations >= 3) e.blockedUntil = now + 3_600_000 // 1-hour block
    return e.blockedUntil > now ? 'blocked' : 'limited'
  }

  e.count++
  return 'ok'
}

// ── In-memory image cache (bounded to 150 entries, ~75 MB max) ───────────────
interface CacheEntry { png: Uint8Array; expiresAt: number }
const imgCache = new Map<string, CacheEntry>()
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours
const CACHE_MAX = 150

function cacheGet(key: string): Uint8Array | null {
  const e = imgCache.get(key)
  if (!e) return null
  if (Date.now() > e.expiresAt) { imgCache.delete(key); return null }
  return e.png
}

function cacheSet(key: string, png: Uint8Array) {
  if (imgCache.size >= CACHE_MAX) {
    const firstKey = imgCache.keys().next().value
    if (firstKey) imgCache.delete(firstKey)
  }
  imgCache.set(key, { png, expiresAt: Date.now() + CACHE_TTL })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const CACHE_HEADERS = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
}

function pngResponse(png: Uint8Array) {
  return new Response(png.buffer as ArrayBuffer, { status: 200, headers: CACHE_HEADERS })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const status = checkRateLimit(ip)

  if (status === 'blocked') {
    // Hard-blocked IP: instant rejection, zero rendering CPU
    return new Response('Forbidden', { status: 403 })
  }

  if (status === 'limited') {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') ?? ''
  const type = searchParams.get('type') ?? 'scholarship'
  const cacheKey = `${type}:${id}`

  // Serve from in-memory cache if available
  const cached = cacheGet(cacheKey)
  if (cached) return pngResponse(cached)

  // ── Fetch data ──
  let title = 'Opportunity'
  let sub = 'Xcel360'
  let meta1Label = 'Country', meta1Value = 'Global'
  let meta2Label = 'Field',   meta2Value = 'General'
  let meta3Label = 'Deadline', meta3Value = 'Open'
  let badgeText = 'Fully funded', badgeColor = '#4ade80', badgeBg = 'rgba(74,222,128,0.15)'

  if (id) {
    try {
      if (type === 'event') {
        const ev = await (prisma as any).event.findUnique({
          where: { id },
          select: { title: true, type: true, date: true, host: true },
        })
        if (ev) {
          title = ev.title
          sub = ev.host ?? 'Xcel360'
          badgeText = ev.type ?? 'Event'
          badgeColor = '#a78bfa'; badgeBg = 'rgba(167,139,250,0.15)'
          meta1Label = 'Type';    meta1Value = ev.type ?? 'Event'
          meta2Label = 'Host';    meta2Value = ev.host ?? 'Xcel360'
          meta3Label = 'Date';    meta3Value = ev.date
            ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'TBC'
        }
      } else {
        const opp = await (prisma as any).opportunity.findUnique({
          where: { id },
          select: { title: true, hostOrg: true, company: true, country: true, fundingType: true, deadline: true, field: true, jobType: true, category: true },
        })
        if (opp) {
          title = opp.title
          sub = opp.company ?? opp.hostOrg
          meta1Value = opp.country
          meta2Value = opp.field ?? 'General'
          meta3Value = opp.deadline
            ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Open'

          if (type === 'job' || type === 'internship') {
            badgeText = opp.jobType ?? (type === 'internship' ? 'Internship' : 'Job')
            badgeColor = '#60a5fa'; badgeBg = 'rgba(96,165,250,0.15)'
            meta2Label = 'Type'; meta2Value = opp.jobType ?? (type === 'internship' ? 'Internship' : 'Full-time')
          } else {
            badgeText = opp.fundingType ?? 'Scholarship'
            const isFull = opp.fundingType === 'Fully funded'
            const isPartial = opp.fundingType === 'Partial'
            badgeColor = isFull ? '#4ade80' : isPartial ? '#60a5fa' : '#fbbf24'
            badgeBg = isFull ? 'rgba(74,222,128,0.15)' : isPartial ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)'
          }
        }
      }
    } catch { /* fallback to defaults */ }
  }

  const titleSize = title.length > 80 ? '44px' : title.length > 55 ? '52px' : title.length > 35 ? '62px' : '72px'

  const bgGradient =
    type === 'job'         ? 'linear-gradient(145deg, #0a1a10 0%, #0c2518 40%, #0e3a22 100%)'
    : type === 'internship' ? 'linear-gradient(145deg, #0f0a1e 0%, #1a0d2e 40%, #26104a 100%)'
    : 'linear-gradient(145deg, #0a0f1e 0%, #0d1b2e 40%, #0f2744 100%)'

  const glowColor =
    type === 'job'         ? 'rgba(34,197,94,0.15)'
    : type === 'internship' ? 'rgba(139,92,246,0.18)'
    : 'rgba(14,165,233,0.18)'

  const accentGradient =
    type === 'job'         ? 'linear-gradient(90deg, #16a34a, #4ade80, #86efac)'
    : type === 'internship' ? 'linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd)'
    : 'linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)'

  const img = new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
        background: bgGradient, fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`, display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)', display: 'flex' }} />
        <div style={{ height: '4px', background: accentGradient, display: 'flex', flexShrink: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 72px 44px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #0369a1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.4)' }}>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 800 }}>X</div>
              </div>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#e0f2fe', letterSpacing: '-0.3px' }}>Xcel360</span>
            </div>
            <div style={{ background: badgeBg, color: badgeColor, fontSize: '17px', fontWeight: 700, padding: '8px 20px', borderRadius: '999px', border: `1.5px solid ${badgeColor}40`, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: badgeColor, display: 'flex' }} />
              {badgeText}
            </div>
          </div>

          <div style={{ fontSize: titleSize, fontWeight: 900, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-1px', maxWidth: '1060px', display: 'flex', flexWrap: 'wrap' }}>
            {title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {type === 'job' || type === 'internship' ? 'Company' : type === 'event' ? 'Host' : 'Offered by'}
                </span>
                <span style={{ fontSize: '20px', color: '#7dd3fc', fontWeight: 700 }}>{sub}</span>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta1Label}</span>
                <span style={{ fontSize: '20px', color: '#e2e8f0', fontWeight: 600 }}>{meta1Value}</span>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta2Label}</span>
                <span style={{ fontSize: '20px', color: '#e2e8f0', fontWeight: 600 }}>{meta2Value}</span>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta3Label}</span>
                <span style={{ fontSize: '20px', color: meta3Value === 'Open' ? '#4ade80' : '#e2e8f0', fontWeight: 600 }}>{meta3Value}</span>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)', color: 'white', fontSize: '17px', fontWeight: 700, padding: '12px 28px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 24px rgba(3,105,161,0.5)' }}>
              {type === 'event' ? 'Register now →' : 'Apply now →'}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )

  // Collect the stream into a typed array so we can cache it in memory
  const chunks: Uint8Array[] = []
  const reader = img.body!.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  const totalLength = chunks.reduce((n, c) => n + c.length, 0)
  const png = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) { png.set(chunk, offset); offset += chunk.length }

  // Store in in-memory cache
  if (id) cacheSet(cacheKey, png)

  return pngResponse(png)
}
