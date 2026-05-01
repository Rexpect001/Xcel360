'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import { daysUntilDeadline, deadlineLabel } from '@/lib/utils'

type Scholarship = {
  id: string; title: string; hostOrg: string; country: string
  fundingType: string; deadline: Date | string | null
  field: string; programLevel: string[]
}

const FUNDING_COLORS: Record<string, string> = {
  'Fully Funded': 'bg-emerald-50 text-emerald-700',
  'Fully funded': 'bg-emerald-50 text-emerald-700',
  'Partial': 'bg-amber-50 text-amber-700',
  'Tuition only': 'bg-blue-50 text-blue-700',
  'Stipend only': 'bg-violet-50 text-violet-700',
  'Other': 'bg-gray-100 text-gray-600',
}

function formatDeadline(date: Date | string | null) {
  if (!date) return 'No deadline'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TopScholarships({ scholarships }: { scholarships: Scholarship[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)
  const items = [...scholarships, ...scholarships]

  useEffect(() => {
    if (!trackRef.current || scholarships.length === 0) return
    const speed = 0.45
    const step = () => {
      if (!paused && trackRef.current) {
        posRef.current += speed
        const half = trackRef.current.scrollWidth / 2
        if (posRef.current >= half) posRef.current = 0
        trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [paused, scholarships.length])

  if (scholarships.length === 0) return null

  return (
    <section className="py-16 border-t border-gray-100" style={{ background: '#f8faff' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Live — Updated daily</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
              Top Scholarships Right Now
            </h2>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Soonest deadlines first — hover to pause</p>
          </div>
          <Link href="/opportunities"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: '#4338ca' }}>
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-16 z-10"
            style={{ background: 'linear-gradient(to right, #f8faff, transparent)' }} />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 z-10"
            style={{ background: 'linear-gradient(to left, #f8faff, transparent)' }} />

          <div ref={trackRef} className="flex gap-4 will-change-transform">
            {items.map((s, i) => {
              const days = daysUntilDeadline(s.deadline)
              const dl = deadlineLabel(days)
              const fundingColor = FUNDING_COLORS[s.fundingType] ?? 'bg-gray-100 text-gray-600'
              const cardBorder = days <= 7 ? '#fecaca' : days <= 30 ? '#fed7aa' : '#e0e7ff'

              return (
                <Link key={`${s.id}-${i}`} href={`/opportunities/${s.id}`}
                  className="flex-shrink-0 w-72 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg bg-white"
                  style={{ border: `1.5px solid ${cardBorder}`, boxShadow: '0 2px 8px rgba(99,102,241,0.06)' }}>

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${fundingColor}`}>
                      {s.fundingType}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dl.color}`}>
                      {dl.text}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2" style={{ color: '#0f172a' }}>
                    {s.title}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: '#64748b' }}>{s.hostOrg}</p>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: '#94a3b8' }}>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.country}</span>
                    {s.deadline && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDeadline(s.deadline)}</span>
                    )}
                  </div>

                  {s.programLevel.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {s.programLevel.slice(0, 2).map((l) => (
                        <span key={l} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#eef2ff', color: '#4338ca' }}>{l}</span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: '#4338ca' }}>
            Browse all scholarships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
