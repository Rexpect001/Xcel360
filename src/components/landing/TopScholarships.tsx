'use client'
import Link from 'next/link'
import { MapPin, ArrowRight, Sparkles } from 'lucide-react'
import { daysUntilDeadline } from '@/lib/utils'

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

function isNew(createdAt: Date | string) {
  return (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
}

function deadlineChip(deadline: Date | string | null) {
  if (!deadline) return { text: 'Rolling', classes: 'bg-gray-100 text-gray-600' }
  const days = daysUntilDeadline(deadline)
  const date = new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (days !== null && days <= 0) return { text: 'Closed', classes: 'bg-gray-100 text-gray-500' }
  if (days !== null && days <= 7) return { text: `${date} · ${days}d`, classes: 'bg-red-50 text-red-700 border border-red-100' }
  if (days !== null && days <= 30) return { text: `${date} · ${days}d`, classes: 'bg-orange-50 text-orange-700 border border-orange-100' }
  return { text: date, classes: 'bg-brand-50 text-brand-700 border border-brand-100' }
}

/** OpportunityDesk-style deadline-led feed of the latest listings. */
export default function TopScholarships({ scholarships }: { scholarships: Scholarship[] }) {
  if (scholarships.length === 0) return null

  const shown = scholarships.slice(0, 12)

  return (
    <section className="py-16 sm:py-20 bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Updated daily
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Latest on the desk
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Fresh scholarships and opportunities - apply before they close.
            </p>
          </div>
          <Link
            href="/opportunities"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 border border-brand-200 bg-brand-50/60 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors whitespace-nowrap"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {shown.map((s) => {
            const chip = deadlineChip(s.deadline)
            const fresh = isNew(s.createdAt)
            return (
              <Link
                key={s.id}
                href={`/opportunities/${s.id}`}
                className="group flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-brand-50/40 transition-colors"
              >
                {/* Deadline chip - OpportunityDesk style, deadline first */}
                <span className={`shrink-0 w-28 text-center text-[11px] font-bold px-2 py-1.5 rounded-lg ${chip.classes}`}>
                  {chip.text}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-[15px] truncate group-hover:text-brand-700 transition-colors">
                      {s.title}
                    </h3>
                    {fresh && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 shrink-0">
                        <Sparkles className="h-2.5 w-2.5" /> NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1.5">
                    {s.hostOrg}
                    <span className="text-gray-300">·</span>
                    <MapPin className="h-3 w-3 shrink-0" />
                    {s.country}
                  </p>
                </div>

                <span className={`hidden md:inline-block shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${FUNDING_COLORS[s.fundingType] ?? FUNDING_COLORS.Other}`}>
                  {s.fundingType}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            )
          })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white bg-brand-700 hover:bg-brand-800 transition-colors"
          >
            Browse all opportunities <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
