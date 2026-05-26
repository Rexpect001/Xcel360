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
  const created = new Date(createdAt)
  const now = new Date()
  return (now.getTime() - created.getTime()) < 7 * 24 * 60 * 60 * 1000
}

export default function TopScholarships({ scholarships }: { scholarships: Scholarship[] }) {
  if (scholarships.length === 0) return null

  return (
    <section className="pt-24 pb-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Recently added — Updated daily</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
              Opportunities with Xcel
            </h2>
            <p className="text-sm mt-1.5" style={{ color: '#475569' }}>
              The latest scholarships added to our platform — apply before they close
            </p>
          </div>
          <Link
            href="/opportunities"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ color: '#0369a1', border: '1.5px solid rgba(3,105,161,0.2)', background: 'rgba(240,249,255,0.8)' }}
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                className="group flex flex-col bg-white rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-md relative overflow-hidden"
                style={{ border: `1.5px solid ${urgentBorder}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                {/* NEW ribbon */}
                {fresh && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(14,165,233,0.1)', color: '#0369a1', border: '1px solid rgba(3,105,161,0.2)' }}>
                      <Sparkles className="h-3 w-3" /> NEW
                    </span>
                  </div>
                )}

                {/* Funding + deadline badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap pr-10">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${fundingColor}`}>
                    {s.fundingType}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dl.color}`}>
                    {dl.text}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-brand-700 transition-colors"
                  style={{ color: '#111827' }}>
                  {s.title}
                </h3>

                {/* Host org */}
                <p className="text-xs font-medium mb-3" style={{ color: '#475569' }}>{s.hostOrg}</p>

                {/* Field */}
                {s.field && (
                  <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#64748b' }}>
                    <BookOpen className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{s.field}</span>
                  </div>
                )}

                {/* Country + deadline */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-auto" style={{ color: '#64748b' }}>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />{s.country}
                  </span>
                  {s.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />{formatDeadline(s.deadline)}
                    </span>
                  )}
                </div>

                {/* Level tags */}
                {s.programLevel.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                    {s.programLevel.slice(0, 2).map((l) => (
                      <span key={l} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#eef2ff', color: '#4338ca' }}>{l}</span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Mobile view all */}
        <div className="mt-8 text-center md:hidden">
          <Link href="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}>
            Browse all scholarships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}
