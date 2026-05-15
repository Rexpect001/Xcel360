import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const revalidate = 3600 // cache OG images for 1 hour — content rarely changes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') ?? 'scholarship' // scholarship | job | internship | event

  let title = 'Opportunity'
  let sub = 'Xcel360'      // host org / company / host
  let meta1Label = 'Country'
  let meta1Value = 'Global'
  let meta2Label = 'Field'
  let meta2Value = 'General'
  let meta3Label = 'Deadline'
  let meta3Value = 'Open'
  let badgeText = 'Fully funded'
  let badgeColor = '#4ade80'
  let badgeBg = 'rgba(74,222,128,0.15)'

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
          badgeColor = '#a78bfa'
          badgeBg = 'rgba(167,139,250,0.15)'
          meta1Label = 'Type'
          meta1Value = ev.type ?? 'Event'
          meta2Label = 'Host'
          meta2Value = ev.host ?? 'Xcel360'
          meta3Label = 'Date'
          meta3Value = ev.date
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
            badgeColor = '#60a5fa'
            badgeBg = 'rgba(96,165,250,0.15)'
            meta2Label = 'Type'
            meta2Value = opp.jobType ?? (type === 'internship' ? 'Internship' : 'Full-time')
            meta3Label = 'Deadline'
          } else {
            // scholarship
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

  const simple = searchParams.get('simple') === 'true'
  const titleSize = title.length > 80 ? '44px' : title.length > 55 ? '52px' : title.length > 35 ? '62px' : '72px'
  const simpleTitleSize = title.length > 80 ? '58px' : title.length > 55 ? '68px' : title.length > 35 ? '80px' : '96px'

  const bgGradient =
    type === 'job'        ? 'linear-gradient(145deg, #0a1a10 0%, #0c2518 40%, #0e3a22 100%)'
    : type === 'internship' ? 'linear-gradient(145deg, #0f0a1e 0%, #1a0d2e 40%, #26104a 100%)'
    : 'linear-gradient(145deg, #0a0f1e 0%, #0d1b2e 40%, #0f2744 100%)'

  const glowColor =
    type === 'job'        ? 'rgba(34,197,94,0.15)'
    : type === 'internship' ? 'rgba(139,92,246,0.18)'
    : 'rgba(14,165,233,0.18)'

  const accentGradient =
    type === 'job'        ? 'linear-gradient(90deg, #16a34a, #4ade80, #86efac)'
    : type === 'internship' ? 'linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd)'
    : 'linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: bgGradient,
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glows */}
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
          display: 'flex',
        }} />

        {/* Top accent */}
        <div style={{ height: '4px', background: accentGradient, display: 'flex', flexShrink: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 72px 44px', justifyContent: 'space-between' }}>

          {/* Brand + funding badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(14,165,233,0.4)',
              }}>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 800 }}>X</div>
              </div>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#e0f2fe', letterSpacing: '-0.3px' }}>Xcel360</span>
            </div>
            <div style={{
              background: badgeBg, color: badgeColor,
              fontSize: '17px', fontWeight: 700,
              padding: '8px 20px', borderRadius: '999px',
              border: `1.5px solid ${badgeColor}40`,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: badgeColor, display: 'flex' }} />
              {badgeText}
            </div>
          </div>

          {/* Big title */}
          <div style={{
            fontSize: simple ? simpleTitleSize : titleSize,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            maxWidth: '1060px',
            display: 'flex',
            flexWrap: 'wrap',
          }}>
            {title}
          </div>

          {/* Bottom row — simple: field pill + domain / full: all meta */}
          {simple ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                color: '#94a3b8',
                fontSize: '18px', fontWeight: 600,
                padding: '10px 24px', borderRadius: '999px',
                display: 'flex', alignItems: 'center',
              }}>
                {meta2Value}
              </div>
              <span style={{ fontSize: '16px', color: '#334155', fontWeight: 500, letterSpacing: '0.04em' }}>
                thexcel360.com
              </span>
            </div>
          ) : (
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
              <div style={{
                background: 'linear-gradient(135deg, #0369a1, #0284c7)',
                color: 'white', fontSize: '17px', fontWeight: 700,
                padding: '12px 28px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 24px rgba(3,105,161,0.5)',
              }}>
                {type === 'event' ? 'Register now →' : 'Apply now →'}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
