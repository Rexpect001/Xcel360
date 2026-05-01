import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  let title = 'Scholarship Opportunity'
  let hostOrg = 'Xcel360'
  let country = 'Global'
  let fundingType = 'Fully funded'
  let deadline = ''
  let field = 'General'

  if (id) {
    try {
      const opp = await (prisma as any).opportunity.findUnique({
        where: { id },
        select: { title: true, hostOrg: true, country: true, fundingType: true, deadline: true, field: true, category: true },
      })
      if (opp) {
        title = opp.title
        hostOrg = opp.hostOrg
        country = opp.country
        fundingType = opp.fundingType
        field = opp.field
        deadline = opp.deadline
          ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Open'
      }
    } catch { /* fallback to defaults */ }
  }

  const fundingColor = fundingType === 'Fully funded' ? '#16a34a' : fundingType === 'Partial' ? '#2563eb' : '#d97706'
  const fundingBg   = fundingType === 'Fully funded' ? '#dcfce7' : fundingType === 'Partial' ? '#dbeafe' : '#fef3c7'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #dbeafe 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: '8px', background: 'linear-gradient(90deg, #0369a1, #0284c7, #38bdf8)', display: 'flex' }} />

        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '52px 72px 44px' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0369a1, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 800 }}>X</div>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#0c4a6e' }}>Xcel360</span>
            <div style={{ flex: 1 }} />
            {/* Funding badge */}
            <div style={{
              background: fundingBg, color: fundingColor,
              fontSize: '16px', fontWeight: 700,
              padding: '6px 18px', borderRadius: '999px',
              border: `1.5px solid ${fundingColor}30`,
              display: 'flex',
            }}>
              {fundingType}
            </div>
          </div>

          {/* Title */}
          <div style={{
            fontSize: title.length > 60 ? '36px' : title.length > 40 ? '42px' : '48px',
            fontWeight: 800,
            color: '#0c4a6e',
            lineHeight: 1.15,
            marginBottom: '20px',
            maxWidth: '900px',
            display: 'flex',
          }}>
            {title}
          </div>

          {/* Host org */}
          <div style={{ fontSize: '24px', color: '#0369a1', fontWeight: 600, marginBottom: 'auto', display: 'flex' }}>
            {hostOrg}
          </div>

          {/* Bottom info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '32px' }}>
            {/* Country */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '20px', color: '#64748b', display: 'flex' }}>📍</div>
              <span style={{ fontSize: '20px', color: '#334155', fontWeight: 600 }}>{country}</span>
            </div>
            {/* Field */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '20px', color: '#64748b', display: 'flex' }}>📚</div>
              <span style={{ fontSize: '20px', color: '#334155', fontWeight: 600 }}>{field}</span>
            </div>
            {/* Deadline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '20px', color: '#64748b', display: 'flex' }}>📅</div>
              <span style={{ fontSize: '20px', color: deadline === 'Open' ? '#16a34a' : '#334155', fontWeight: 600 }}>
                {deadline === 'Open' ? 'Open Deadline' : `Closes ${deadline}`}
              </span>
            </div>

            <div style={{ flex: 1 }} />

            {/* CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #0369a1, #0284c7)',
              color: 'white', fontSize: '18px', fontWeight: 700,
              padding: '10px 28px', borderRadius: '12px',
              display: 'flex',
            }}>
              Apply on thexcel360.com →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
