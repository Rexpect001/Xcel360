'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'

type Scholarship = {
  id: string
  title: string
  hostOrg: string
  country: string
  fundingType: string
  deadline: Date | string
  field: string
  programLevel: string[]
}

const FUNDING_COLORS: Record<string, string> = {
  'Fully Funded': 'bg-green-100 text-green-700',
  'Partial': 'bg-yellow-100 text-yellow-700',
  'Tuition Only': 'bg-blue-100 text-blue-700',
  'Stipend Only': 'bg-purple-100 text-purple-700',
}

function formatDeadline(date: Date | string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysLeft(date: Date | string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  return diff
}

export default function TopScholarships({ scholarships }: { scholarships: Scholarship[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const posRef = useRef(0)
  const rafRef = useRef<number>(0)

  // Duplicate list for seamless loop
  const items = [...scholarships, ...scholarships]

  useEffect(() => {
    if (!trackRef.current || scholarships.length === 0) return

    const speed = 0.5 // px per frame

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
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Updated daily</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Scholarships Right Now</h2>
            <p className="text-gray-500 text-sm mt-1">Live opportunities from our platform — deadlines approaching first</p>
          </div>
          <Link
            href="/opportunities"
            className="hidden md:inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm hover:text-brand-800 transition-colors"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Scrolling ticker */}
        <div
          className="overflow-hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent z-10" />

          <div ref={trackRef} className="flex gap-4 will-change-transform">
            {items.map((s, i) => {
              const days = daysLeft(s.deadline)
              const urgency = days <= 7 ? 'border-red-200 bg-red-50' : days <= 30 ? 'border-orange-100 bg-orange-50/40' : 'border-gray-100 bg-white'
              const daysLabel = days <= 0 ? 'Closed' : days === 1 ? '1 day left' : `${days} days left`
              const daysColor = days <= 7 ? 'text-red-600 bg-red-100' : days <= 30 ? 'text-orange-600 bg-orange-100' : 'text-green-700 bg-green-100'
              const fundingColor = FUNDING_COLORS[s.fundingType] ?? 'bg-gray-100 text-gray-600'

              return (
                <Link
                  key={`${s.id}-${i}`}
                  href={`/opportunities/${s.id}`}
                  className={`flex-shrink-0 w-72 rounded-2xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${urgency}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${fundingColor}`}>
                      {s.fundingType}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${daysColor}`}>
                      {daysLabel}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{s.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{s.hostOrg}</p>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.country}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDeadline(s.deadline)}</span>
                  </div>

                  {s.programLevel.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {s.programLevel.slice(0, 2).map((l) => (
                        <span key={l} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{l}</span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center md:hidden">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm"
          >
            Browse all scholarships <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
