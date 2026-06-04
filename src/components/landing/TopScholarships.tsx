'use client'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight, Sparkles, BookOpen } from 'lucide-react'
import { daysUntilDeadline, deadlineLabel } from '@/lib/utils'

type Scholarship = {
  id: string; title: string; hostOrg: string; country: string
  fundingType: string; deadline: Date | string | null
  field: string; programLevel: string[]; createdAt: Date | string
}

const FUNDING_COLORS: Record<string, string> = {
  'Fully Funded':  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Fully funded':  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Partial':       'bg-amber-50 text-amber-700 border-amber-100',
  'Tuition only':  'bg-blue-50 text-blue-700 border-blue-100',
  'Stipend only':  'bg-violet-50 text-violet-700 border-violet-100',
  'Other':         'bg-gray-100 text-gray-600 border-gray-200',
}

function formatDeadline(date: Date | string | null) {
  if (!date) return 'Open'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isNew(createdAt: Date | string) {
  return (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
}

export default function TopScholarships({ scholarships }: { scholarships: Scholarship[] }) {
  if (scholarships.length === 0) return null

  return (
    <section className="pt-10 pb-14 bg-white w-full">
      {/*
        No max-w cap on the outer wrapper — padding scales with viewport.
        This lets the grid fill available space at any browser zoom level.
      */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">

        {/* Header — capped so headline text doesn't stretch uncomfortably wide */}
        <div className="max-w-[1800px] mx-auto flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Recently added — Updated daily
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
              Open Opportunities
            </h2>
            <p className="text-sm mt-1.5" style={{ color: '#475569' }}>
              The latest scholarships and opportunities added — apply before they close
            </p>
          </div>
          <Link
            href="/opportunities"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
            style={{ color: '#0369a1', border: '1.5px solid rgba(3,105,161,0.2)', background: 'rgba(240,249,255,0.8)' }}
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/*
          auto-fill grid: browser calculates how many 240px columns fit
          at the current viewport width — works at any zoom level.
          Zoomed out → more columns form automatically.
          Zoomed in / mobile → fewer columns, never below 1.
        */}
        <div
          className="max-w-[1800px] mx-auto"
          style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          }}
        >
          {scholarships.map((s) => {
            const days = daysUntilDeadline(s.deadline)
            const dl = deadlineLabel(days)
            const fundingColor = FUNDING_COLORS[s.fundingType] ?? 'bg-gray-100 text-gray-600 border-gray-200'
            const urgentBorder = days !== null && days <= 7 ? '#fca5a5' : days !== null && days <= 30 ? '#fdba74' : '#e2e8f0'
            const fresh = isNew(s.createdAt)

            return (
              <Link
                key={s.id}
                href={`/opportunities/${s.id}`}
                className="group flex flex-col bg-white rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
                style={{ border: `1.5px solid ${urgentBorder}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                {/* NEW ribbon */}
                {fresh && (
                  <div className="absolute top-3.5 right-3.5">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(14,165,233,0.1)', color: '#0369a1', border: '1px solid rgba(3,105,161,0.2)' }}
                    >
                      <Sparkles className="h-3 w-3" /> NEW
                    </span>
                  </div>
                )}

                {/* Funding + deadline badges */}
                <div className="flex items-center gap-2 mb-3.5 flex-wrap pr-12">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${fundingColor}`}>
                    {s.fundingType}
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${dl.color}`}>
                    {dl.text}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="font-bold text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-brand-700 transition-colors"
                  style={{ color: '#111827' }}
                >
                  {s.title}
                </h3>

                {/* Host org */}
                <p className="text-sm font-medium mb-3" style={{ color: '#475569' }}>{s.hostOrg}</p>

                {/* Field */}
                {s.field && (
                  <div className="flex items-center gap-1.5 text-[13px] mb-3" style={{ color: '#64748b' }}>
                    <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{s.field}</span>
                  </div>
                )}

                {/* Country + deadline */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] mt-auto" style={{ color: '#64748b' }}>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />{s.country}
                  </span>
                  {s.deadline && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />{formatDeadline(s.deadline)}
                    </span>
                  )}
                </div>

                {/* Level tags */}
                {s.programLevel.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {s.programLevel.slice(0, 2).map((l) => (
                      <span
                        key={l}
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: '#eef2ff', color: '#4338ca' }}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Mobile view all */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}
          >
            Browse all scholarships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}
