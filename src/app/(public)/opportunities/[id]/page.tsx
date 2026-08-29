export const revalidate = 3600
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const opp = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!opp) return { title: 'Scholarship Not Found' }

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
      ...(opp.imageUrl ? { images: [{ url: opp.imageUrl, alt: opp.title }] } : {}),
    },
    twitter: {
      card: opp.imageUrl ? 'summary_large_image' : 'summary',
      title: opp.title,
      description,
      ...(opp.imageUrl ? { images: [opp.imageUrl] } : {}),
    },
  }
}

import { formatDate, daysUntilDeadline, getFundingBadgeColor } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import ShareButtons from '@/components/ui/ShareButtons'
import {
  Calendar, MapPin, BookOpen, FileText, CheckCircle, Download,
  ArrowLeft, Sparkles, Globe, Building2, GraduationCap, Clock,
} from 'lucide-react'
import Link from 'next/link'
import ApplyButton from '@/components/ui/ApplyButton'
import SaveButton from '@/components/ui/SaveButton'
import AdSlot from '@/components/ads/AdSlot'
import { getAuth } from '@/lib/auth'
import { scoreOpportunity } from '@/lib/matching'
import type { ReactNode } from 'react'

// Renders inline **bold** markers safely
function renderInline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-gray-900">{part}</strong>
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
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
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
        <h3 key={`h-${idx}`} className="font-bold text-gray-900 text-sm mt-4 mb-1">
          {headerText(trimmed)}
        </h3>
      )
    } else {
      nodes.push(
        <p key={`p-${idx}`} className="text-gray-700 text-sm leading-relaxed">
          {renderInline(trimmed)}
        </p>
      )
    }
  })
  flushBullets('ul-end')

  return <div className="space-y-1">{nodes}</div>
}

function deadlineTone(days: number, closed: boolean) {
  if (closed) return { chip: 'bg-red-100 text-red-700', label: 'Closed' }
  if (days <= 7) return { chip: 'bg-red-100 text-red-700', label: `${days}d left` }
  if (days <= 30) return { chip: 'bg-orange-100 text-orange-700', label: `${days} days left` }
  return { chip: 'bg-green-100 text-green-700', label: `${days} days left` }
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [opp, session] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null),
    getAuth(),
  ])
  if (!opp) notFound()

  const isClosed = opp.status === 'CLOSED' || (opp.deadline !== null && opp.deadline.getTime() < Date.now())
  const days = daysUntilDeadline(opp.deadline)
  const tone = deadlineTone(days, isClosed)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'
  const pageUrl = `${appUrl}/opportunities/${opp.id}`

  // Personalised match score for signed-in users
  let match: { score: number; reasons: string[] } | null = null
  if (session?.user?.id) {
    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } }).catch(() => null)
    if (profile) {
      const scored = scoreOpportunity(opp, profile)
      if (scored.score >= 40) match = scored
    }
  }

  // Related opportunities - same field or destination, still open
  const related = await prisma.opportunity.findMany({
    where: {
      id: { not: opp.id },
      status: 'OPEN',
      deadline: { gt: new Date() },
      OR: [{ field: opp.field }, { country: opp.country }],
    },
    orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
    take: 3,
    select: {
      id: true, title: true, hostOrg: true, country: true,
      fundingType: true, deadline: true, field: true,
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
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* ── Hero band ── */}
        <div className="bg-hero-gradient text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-1.5 text-sm text-brand-100 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Browse all opportunities
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur text-white">
                {opp.fundingType}
              </span>
              {opp.programLevel.map((l) => (
                <span key={l} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-brand-50">
                  {l}
                </span>
              ))}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-brand-50">
                {opp.field}
              </span>
              {isClosed && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500/90 text-white">
                  Applications Closed
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3">{opp.title}</h1>
            <p className="text-brand-100 flex items-center gap-2 text-sm sm:text-base">
              <Building2 className="h-4 w-4 shrink-0" /> {opp.hostOrg}
            </p>

            {/* Match badge for signed-in users */}
            {match && (
              <div className="mt-5 inline-flex flex-wrap items-center gap-2 bg-white/12 backdrop-blur rounded-xl px-4 py-2.5 border border-white/15">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-semibold">{match.score}% match for you</span>
                {match.reasons.length > 0 && (
                  <span className="text-xs text-brand-100">· {match.reasons.join(', ')}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Key facts strip ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: MapPin, label: 'Destination', value: `${opp.country}${opp.region ? `, ${opp.region}` : ''}` },
              { icon: Calendar, label: 'Deadline', value: formatDate(opp.deadline) },
              { icon: GraduationCap, label: 'Levels', value: opp.programLevel.join(', ') || 'All levels' },
              { icon: Clock, label: 'Time left', value: isClosed ? 'Closed' : tone.label, chip: tone.chip },
            ].map(({ icon: FactIcon, label, value, chip }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                  <FactIcon className="h-4 w-4 text-brand-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{label}</div>
                  {chip ? (
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${chip}`}>{value}</span>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900 truncate">{value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Poster image */}
          {opp.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={opp.imageUrl}
                alt={`${opp.title} poster`}
                className="w-full max-h-[520px] object-contain"
              />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* ── Main column ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Email application notice */}
              {opp.applicationLink && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(opp.applicationLink.trim()) && (
                <section className="bg-brand-50 border-2 border-brand-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-brand-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-600" /> How to Apply
                  </h2>
                  <p className="text-sm text-brand-800 font-semibold leading-relaxed">
                    Send your application directly via email to:{' '}
                    <a href={`mailto:${opp.applicationLink.trim()}`} className="underline text-brand-700 break-all">
                      {opp.applicationLink.trim()}
                    </a>
                  </p>
                </section>
              )}

              {opp.description && (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-600" /> About this {opp.category === 'JOB' ? 'role' : opp.category === 'INTERNSHIP' ? 'internship' : 'scholarship'}
                  </h2>
                  <Description text={opp.description} />
                </section>
              )}

              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-brand-600" /> Eligibility
                </h2>
                <div className="text-gray-700 text-sm leading-relaxed">
                  <Description text={opp.eligibility ?? ''} />
                </div>
              </section>

              {opp.requiredDocs.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-600" /> Required Documents
                  </h2>
                  <ul className="grid sm:grid-cols-2 gap-2.5">
                    {opp.requiredDocs.map((doc) => (
                      <li key={doc} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Share */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <ShareButtons
                  title={opp.title}
                  url={pageUrl}
                  applicationLink={opp.applicationLink || undefined}
                />
              </div>
            </div>

            {/* ── Sticky action sidebar ── */}
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Ready to apply?</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tone.chip}`}>
                    {isClosed ? 'Closed' : tone.label}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <ApplyButton href={opp.applicationLink} title={opp.title} />
                  <SaveButton opportunityId={opp.id} />
                  {(opp as any).pdfUrl && (
                    <a
                      href={(opp as any).pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-4 w-4 text-brand-600" /> Download PDF
                    </a>
                  )}
                </div>
                {!session && (
                  <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                    <Link href="/signup" className="text-brand-700 font-semibold hover:underline">Create a free account</Link>{' '}
                    to save this opportunity and get automatic deadline reminders.
                  </p>
                )}
              </div>

              {/* Quick summary */}
              <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
                <h3 className="font-semibold text-brand-900 mb-3">Quick Summary</h3>
                <dl className="space-y-2.5 text-sm">
                  <div><dt className="text-gray-500 text-xs">Host</dt><dd className="font-medium text-gray-900">{opp.hostOrg}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Country</dt><dd className="font-medium text-gray-900">{opp.country}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Funding</dt><dd className="font-medium text-gray-900">{opp.fundingType}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Deadline</dt><dd className="font-medium text-gray-900">{formatDate(opp.deadline)}</dd></div>
                  <div><dt className="text-gray-500 text-xs">Levels</dt><dd className="font-medium text-gray-900">{opp.programLevel.join(', ')}</dd></div>
                </dl>
              </div>

              <AdSlot placement="opportunity-detail-sidebar" />
            </div>
          </div>

          {/* ── Related opportunities ── */}
          {related.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-brand-600" /> Similar opportunities
                </h2>
                <Link href="/opportunities" className="text-sm text-brand-600 font-medium hover:text-brand-800 transition-colors">
                  View all →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.map((rel) => {
                  const relDays = daysUntilDeadline(rel.deadline)
                  return (
                    <Link
                      key={rel.id}
                      href={`/opportunities/${rel.id}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group"
                    >
                      <div className="h-1 bg-gradient-to-r from-brand-600 to-brand-400" />
                      <div className="p-5">
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-700 transition-colors line-clamp-2 mb-1.5 leading-snug">
                          {rel.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 truncate">{rel.hostOrg} · {rel.country}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="blue">{rel.fundingType}</Badge>
                          <span className={`text-xs font-medium ${relDays <= 7 ? 'text-red-600' : 'text-gray-400'}`}>
                            {relDays > 0 ? `${relDays}d left` : 'Closing soon'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
