import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { deadlineInfo, fundingTone } from '@/lib/opportunity-display'
import { cn } from '@/lib/utils'

type Scholarship = {
  id: string; title: string; hostOrg: string; country: string
  fundingType: string; deadline: Date | string | null
  programLevel: string[]; createdAt: Date | string
}

/** Deadline-first feed of the newest listings - scannable like a notice board. */
export default function TopScholarships({ scholarships }: { scholarships: Scholarship[] }) {
  if (scholarships.length === 0) return null

  return (
    <section className="py-16 sm:py-20 bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <p className="eyebrow mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Just posted
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Latest scholarships</h2>
            <p className="text-sm text-ink-500 mt-2">Newest first. The date on the left is the application deadline.</p>
          </div>
          <Link href="/opportunities?sort=newest" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-ink-900 whitespace-nowrap">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="paper-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[130px_minmax(0,1fr)_150px_130px_24px] gap-4 px-6 py-2.5 border-b border-surface-100 bg-surface-50 text-[10.5px] font-bold uppercase tracking-wider text-ink-400">
            <span>Deadline</span><span>Scholarship</span><span>Level</span><span>Funding</span><span />
          </div>
          <ul className="divide-y divide-surface-100">
            {scholarships.map((s) => {
              const dl = deadlineInfo(s.deadline)
              return (
                <li key={s.id}>
                  <Link
                    href={`/opportunities/${s.id}`}
                    className="group grid grid-cols-[92px_minmax(0,1fr)_20px] md:grid-cols-[130px_minmax(0,1fr)_150px_130px_24px] items-center gap-4 px-4 sm:px-6 py-4 hover:bg-surface-50 transition-colors"
                  >
                    <span className="leading-tight">
                      <span className="block text-[13px] font-bold text-ink-900">{dl.date}</span>
                      <span className={cn('block text-[11px] font-semibold mt-0.5', dl.tone)}>{dl.label}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink-900 text-[15px] truncate group-hover:text-brand-700 transition-colors">{s.title}</span>
                      <span className="block text-xs text-ink-400 mt-0.5 truncate">{s.hostOrg} · {s.country}</span>
                    </span>
                    <span className="hidden md:block text-xs font-medium text-ink-600 truncate">{s.programLevel.slice(0, 2).join(', ') || 'All levels'}</span>
                    <span className="hidden md:block">
                      <span className={cn('inline-block text-[11px] font-bold px-2 py-1 rounded', fundingTone(s.fundingType))}>{s.fundingType}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-ink-200 group-hover:text-ink-700 transition-colors" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/opportunities" className="btn-primary">
            Browse all scholarships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
