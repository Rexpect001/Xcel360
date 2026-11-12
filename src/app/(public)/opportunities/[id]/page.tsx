export const revalidate = 3600
export async function generateStaticParams() { return [] }
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const opp = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!opp) return { title: 'Scholarship Not Found' }
  const imageUrl = opp.imageUrl?.includes('/api/og') ? null : opp.imageUrl

  const description = opp.description
    ? opp.description.slice(0, 155).trim() + (opp.description.length > 155 ? '...' : '')
    : `${opp.fundingType} scholarship by ${opp.hostOrg} for ${opp.programLevel.join(', ')} students in ${opp.country}. Deadline: ${opp.deadline?.toLocaleDateString('en-GB') ?? 'TBC'}.`

  return {
    title: opp.title,
    description,
    keywords: [
      opp.title,
      opp.hostOrg,
      opp.fundingType,
      opp.country,
      opp.field,
      ...opp.programLevel,
      'scholarship',
      'study abroad',
    ].filter(Boolean),
    alternates: { canonical: `/opportunities/${opp.id}` },
    openGraph: {
      title: opp.title,
      description,
      url: `${BASE}/opportunities/${opp.id}`,
      type: 'article',
      // Use uploaded image if available; skip auto-generated OG otherwise
      images: imageUrl ? [{ url: imageUrl, alt: opp.title }] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: opp.title,
      description,
      images: [imageUrl ?? DEFAULT_OG_IMAGE.url],
    },
  }
}

import { formatDate, daysUntilDeadline } from '@/lib/utils'
import ShareButtons from '@/components/ui/ShareButtons'
import {
  Calendar, MapPin, FileText, CheckCircle, Download,
  Building2, GraduationCap, Clock,
} from 'lucide-react'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import GoogleAd from '@/components/ads/GoogleAd'
import BrandPattern from '@/components/brand/BrandPattern'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'
import Link from 'next/link'
import ApplyButton from '@/components/ui/ApplyButton'
import SaveButton from '@/components/ui/SaveButton'
import OpportunityMatch from '@/components/opportunities/OpportunityMatch'
import GuestPrompt from '@/components/opportunities/GuestPrompt'
import TailorApplication from '@/components/opportunities/TailorApplication'
import type { ReactNode } from 'react'

// Renders inline **bold** markers safely
function renderInline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-ink-900">{part}</strong>
      : part
  )
}

// Detects only explicit markdown section headers: ## or ###
function isHeader(line: string): boolean {
  return line.startsWith('### ') || line.startsWith('## ')
}

function headerText(line: string): string {
  return line.replace(/^#{1,3}\s*/, '').replace(/:$/, '').trim()
}

// Renders description with bold headers, bullet lists, and inline **bold**
function Description({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = (key: string) => {
    if (!bullets.length) return
    nodes.push(
      <ul key={key} className="space-y-1.5 my-2 pl-1">
        {bullets.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-700">
            <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-accent-500 flex-shrink-0" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
    bullets = []
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) { flushBullets(`ul-${idx}`); return }

    const bulletText = trimmed.startsWith('- ') || trimmed.startsWith('* ')
      ? trimmed.slice(2).trim()
      : trimmed.charCodeAt(0) === 8226
        ? trimmed.slice(1).trim()
        : null
    if (bulletText) {
      bullets.push(bulletText)
      return
    }

    flushBullets(`ul-${idx}`)

    if (isHeader(trimmed)) {
      nodes.push(
        <h3 key={`h-${idx}`} className="font-bold text-ink-900 text-base mt-5 mb-1.5">
          {headerText(trimmed)}
        </h3>
      )
    } else {
      nodes.push(
        <p key={`p-${idx}`} className="text-ink-700 text-[15px] leading-relaxed">
          {renderInline(trimmed)}
        </p>
      )
    }
  })
  flushBullets('ul-end')

  return <div className="space-y-2 max-w-[68ch]">{nodes}</div>
}

function deadlineTone(days: number, closed: boolean) {
  if (closed) return { chip: 'bg-red-50 text-red-700', label: 'Closed' }
  if (days >= 999) return { chip: 'bg-surface-100 text-ink-700', label: 'Rolling' }
  if (days <= 7) return { chip: 'bg-red-50 text-red-700', label: `${days} day${days === 1 ? '' : 's'} left` }
  if (days <= 30) return { chip: 'bg-amber-50 text-amber-800', label: `${days} days left` }
  return { chip: 'bg-emerald-50 text-emerald-700', label: `${days} days left` }
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opp = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!opp) notFound()

  const isClosed = opp.status === 'CLOSED' || (opp.deadline !== null && opp.deadline.getTime() < Date.now())
  const days = daysUntilDeadline(opp.deadline)
  const tone = deadlineTone(days, isClosed)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'
  const pageUrl = `${appUrl}/opportunities/${opp.id}`

  // Related opportunities - same field or destination, still open
  const related = await prisma.opportunity.findMany({
    where: liveOpportunityWhere({
      id: { not: opp.id },
      category: opp.category,
      OR: [{ field: opp.field }, { country: opp.country }],
    }),
    orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
    take: 3,
    select: {
      id: true, title: true, hostOrg: true, country: true, category: true,
      fundingType: true, deadline: true, field: true, programLevel: true,
      eligibility: true, createdAt: true,
    },
  }).catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: opp.title,
    description: opp.description ?? `${opp.fundingType} scholarship by ${opp.hostOrg}`,
    provider: {
      '@type': 'Organization',
      name: opp.hostOrg,
    },
    url: pageUrl,
    applicationDeadline: opp.deadline?.toISOString(),
    educationalProgramMode: 'full-time',
    occupationalCategory: opp.field,
    offers: {
      '@type': 'Offer',
      category: opp.fundingType,
      eligibleRegion: {
        '@type': 'Place',
        name: opp.country,
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-surface-50">
        {/* ── Header band ── */}
        <div className="relative overflow-hidden bg-hero-gradient text-white pt-16">
          <BrandPattern opacity={0.09} />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-14">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-100 mb-6">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/opportunities" className="hover:text-white">Scholarships</Link>
              <span>/</span>
              <span className="text-brand-100 truncate max-w-[220px]">{opp.title}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-accent-300 text-ink-900">
                {opp.fundingType}
              </span>
              {opp.programLevel.map((l) => (
                <span key={l} className="text-[11px] font-semibold px-2 py-1 rounded bg-white/10 text-brand-50">{l}</span>
              ))}
              {opp.field && <span className="text-[11px] font-semibold px-2 py-1 rounded bg-white/10 text-brand-50">{opp.field}</span>}
              {isClosed && (
                <span className="text-[11px] font-bold px-2 py-1 rounded bg-red-500 text-white">Applications closed</span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] max-w-4xl text-white">{opp.title}</h1>
            <p className="mt-3 text-brand-100 flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="h-4 w-4 shrink-0" /> {opp.hostOrg}
            </p>

            <OpportunityMatch opportunityId={opp.id} />
          </div>
        </div>

        {/* ── At a glance ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-7 relative z-10">
          <div className="paper-card grid grid-cols-2 md:grid-cols-4">
            {[
              { icon: MapPin, label: 'Destination', value: `${opp.country}${opp.region ? `, ${opp.region}` : ''}` },
              { icon: GraduationCap, label: 'Level', value: opp.programLevel.join(', ') || 'All levels' },
              { icon: Calendar, label: 'Deadline', value: formatDate(opp.deadline) },
              { icon: Clock, label: 'Time left', value: isClosed ? 'Closed' : tone.label, chip: tone.chip },
            ].map(({ icon: FactIcon, label, value, chip }) => (
              <div key={label} className="flex items-start gap-3 p-4 sm:p-5 border-surface-100 [&:not(:last-child)]:md:border-r [&:nth-child(-n+2)]:border-b md:[&:nth-child(-n+2)]:border-b-0">
                <FactIcon className="h-4 w-4 mt-0.5 text-accent-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10.5px] text-ink-400 uppercase tracking-wider font-bold">{label}</div>
                  {chip ? (
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded mt-1 ${chip}`}>{value}</span>
                  ) : (
                    <div className="text-sm font-semibold text-ink-900 mt-0.5">{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
            {/* ── Main column ── */}
            <div className="space-y-6 min-w-0">
              {opp.applicationLink && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(opp.applicationLink.trim()) && (
                <section className="bg-accent-50 border border-accent-200 rounded-2xl p-6">
                  <h2 className="font-display text-xl text-ink-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent-600" /> How to apply
                  </h2>
                  <p className="text-sm text-ink-700 leading-relaxed">
                    Send your application by email to{' '}
                    <a href={`mailto:${opp.applicationLink.trim()}`} className="font-semibold underline text-ink-900 break-all">
                      {opp.applicationLink.trim()}
                    </a>
                  </p>
                </section>
              )}

              {/* Real uploaded posters only - auto-generated /api/og title cards just repeat the heading */}
              {opp.imageUrl && !opp.imageUrl.includes('/api/og') && (
                <figure className="paper-card overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opp.imageUrl}
                    alt={`${opp.title} poster`}
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-[480px] object-contain bg-surface-100"
                  />
                </figure>
              )}

              {opp.description && (
                <section className="paper-card p-6 sm:p-8">
                  <h2 className="font-display text-2xl text-ink-900 mb-4">
                    About this {opp.category === 'JOB' ? 'role' : opp.category === 'INTERNSHIP' ? 'internship' : 'scholarship'}
                  </h2>
                  <Description text={opp.description} />
                </section>
              )}

              <GoogleAd placement="detail-inline" />

              <section className="paper-card p-6 sm:p-8">
                <h2 className="font-display text-2xl text-ink-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" /> Who can apply
                </h2>
                <Description text={opp.eligibility ?? ''} />
              </section>

              {opp.requiredDocs.length > 0 && (
                <section className="paper-card p-6 sm:p-8">
                  <h2 className="font-display text-2xl text-ink-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent-600" /> Documents you will need
                  </h2>
                  <ul className="grid sm:grid-cols-2 gap-2.5">
                    {opp.requiredDocs.map((doc) => (
                      <li key={doc} className="flex items-center gap-2 text-sm text-ink-700 bg-surface-50 border border-surface-100 rounded-lg px-3 py-2.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-ink-500">
                    Need a CV, SOP or cover letter? Xcel360 writing tools can draft them for this listing.{' '}
                    <Link href={`/dashboard/tools/cv?opportunity=${opp.id}`} className="font-semibold text-brand-700 hover:underline">Start with your CV</Link>
                  </p>
                </section>
              )}

              <div className="paper-card p-5">
                <ShareButtons title={opp.title} url={pageUrl} applicationLink={opp.applicationLink || undefined} />
              </div>
            </div>

            {/* ── Sticky action sidebar ── */}
            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="paper-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-ink-900">Ready to apply?</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${tone.chip}`}>{isClosed ? 'Closed' : tone.label}</span>
                </div>
                <div className="grid gap-2.5 [&>*]:w-full [&>*]:justify-center">
                  <ApplyButton href={opp.applicationLink} title={opp.title} />
                  <SaveButton opportunityId={opp.id} />
                  {opp.pdfUrl && (
                    <a
                      href={opp.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 text-sm font-semibold text-ink-700 hover:bg-surface-50 transition-colors"
                    >
                      <Download className="h-4 w-4 text-accent-600" /> Download PDF
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-ink-400 mt-4 leading-relaxed">
                  You apply on the provider&apos;s official website. Xcel360 never charges application fees.
                </p>
                <GuestPrompt />
              </div>

              {!isClosed && <TailorApplication opportunityId={opp.id} category={opp.category} />}

              <div className="rounded-2xl bg-brand-600 text-white p-5">
                <h3 className="font-bold text-white mb-3">Quick summary</h3>
                <dl className="space-y-2.5 text-sm">
                  {[
                    ['Host', opp.hostOrg],
                    ['Country', opp.country],
                    ['Funding', opp.fundingType],
                    ['Deadline', formatDate(opp.deadline)],
                    ['Levels', opp.programLevel.join(', ') || 'All levels'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                      <dt className="text-brand-100 text-xs">{k}</dt>
                      <dd className="font-semibold text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <GoogleAd placement="detail-sidebar" shape="rectangle" />
            </aside>
          </div>

          {/* ── Related opportunities ── */}
          {related.length > 0 && (
            <section className="mt-14">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="eyebrow mb-1">Keep exploring</p>
                  <h2 className="font-display text-2xl text-ink-900">Similar opportunities</h2>
                </div>
                <Link href="/opportunities" className="text-sm text-brand-700 font-semibold hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((rel) => (
                  <OpportunityCard key={rel.id} opp={rel} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
