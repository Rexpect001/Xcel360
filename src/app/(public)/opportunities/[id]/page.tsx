export const revalidate = 3600
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const opp = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!opp) return { title: 'Scholarship Not Found' }

  const description = opp.description
    ? opp.description.slice(0, 155).trim() + (opp.description.length > 155 ? '…' : '')
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
import { Calendar, MapPin, BookOpen, FileText, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'
import ApplyButton from '@/components/ui/ApplyButton'
import SaveButton from '@/components/ui/SaveButton'
import { getAuth } from '@/lib/auth'
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
            <span className="text-brand-500 mt-1 select-none flex-shrink-0 text-xs">●</span>
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

    const bulletMatch = trimmed.match(/^[•\-\*]\s*(.+)/)
    if (bulletMatch) {
      bullets.push(bulletMatch[1])
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

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const [opp, session] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null),
    getAuth(),
  ])
  if (!opp) notFound()

  const days = daysUntilDeadline(opp.deadline)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'
  const pageUrl = `${appUrl}/opportunities/${opp.id}`

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
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getFundingBadgeColor(opp.fundingType)}`}>
              {opp.fundingType}
            </span>
            {opp.programLevel.map((l) => <Badge key={l} variant="blue">{l}</Badge>)}
            <Badge variant="gray">{opp.field}</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{opp.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{opp.hostOrg}</p>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              {opp.country}{opp.region ? `, ${opp.region}` : ''}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-600" />
              Deadline: <strong>{formatDate(opp.deadline)}</strong>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${days <= 7 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {days > 0 ? `${days} days left` : 'Closed'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 items-center">
            <ApplyButton href={opp.applicationLink} title={opp.title} />
            <SaveButton opportunityId={opp.id} />
            {(opp as any).pdfUrl && (
              <a
                href={(opp as any).pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4 text-brand-600" /> Download PDF
              </a>
            )}
          </div>

          {/* Share buttons */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <ShareButtons
              title={opp.title}
              url={pageUrl}
              applicationLink={opp.applicationLink || undefined}
            />
          </div>
        </div>
      </div>

      {/* Poster image */}
      {opp.imageUrl && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={opp.imageUrl}
              alt={`${opp.title} poster`}
              className="w-full max-h-[520px] object-contain"
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main */}
          <div className="md:col-span-2 space-y-8">
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
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-brand-600" /> About this scholarship
                </h2>
                <Description text={opp.description} />
              </section>
            )}

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Eligibility</h2>
              <div className="text-gray-700 text-sm leading-relaxed">
                <Description text={opp.eligibility ?? ''} />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" /> Required Documents
              </h2>
              <ul className="space-y-2">
                {opp.requiredDocs.map((doc) => (
                  <li key={doc} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {doc}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
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

            {!session && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Track this scholarship</h3>
                <p className="text-sm text-gray-500 mb-4">Save it to your dashboard and get deadline reminders automatically.</p>
                <Link href="/signup" className="block w-full text-center bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors">
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
