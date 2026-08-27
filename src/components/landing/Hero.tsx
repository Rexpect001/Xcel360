'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, ShieldCheck } from 'lucide-react'

const popularSearches = ['Fulbright', 'DAAD Germany', 'Commonwealth', 'Erasmus+', 'Chevening']

interface HeroProps {
  stats: { opportunities: number; members: number; countries: number; resources: number }
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`
  return `${n}+`
}

export default function Hero({ stats }: HeroProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/opportunities${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
  }

  const statItems = [
    { value: formatCount(stats.opportunities), label: 'Open opportunities' },
    { value: formatCount(stats.members), label: 'Community members' },
    { value: formatCount(stats.countries), label: 'Destination countries' },
    { value: formatCount(stats.resources), label: 'Guides & resources' },
  ]

  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white">
      {/* Decorative orbs */}
      <div className="orb w-[480px] h-[480px] bg-white -top-40 -right-32" />
      <div className="orb w-[380px] h-[380px] bg-brand-300 -bottom-48 -left-24" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-36 sm:pb-20 text-center">
        {/* Trust eyebrow */}
        <div className="inline-flex items-center gap-2 bg-white/12 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-7">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-xs font-semibold tracking-wide text-brand-50">
            Every opportunity vetted before it is listed
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
          Your future,
          <br />
          <span className="text-amber-300">fully funded.</span>
        </h1>
        <p className="text-base sm:text-lg text-brand-100 max-w-2xl mx-auto mb-9 leading-relaxed">
          Scholarships, fellowships, jobs and internships — matched to your profile,
          tracked to the deadline, with mentors to guide you all the way.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex bg-white rounded-2xl overflow-hidden shadow-card-3d">
            <div className="flex items-center pl-5 shrink-0 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a scholarship, country, or field…"
              className="flex-1 px-4 py-4 text-sm sm:text-base text-gray-900 focus:outline-none placeholder:text-gray-400 min-w-0"
            />
            <button
              type="submit"
              className="px-5 sm:px-7 py-4 font-semibold text-sm text-white bg-accent-500 hover:bg-accent-600 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Popular searches */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-4">
            <span className="text-xs text-brand-100">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => router.push(`/opportunities?search=${encodeURIComponent(term)}`)}
                className="text-xs px-3 py-1.5 rounded-full text-white bg-white/12 border border-white/15 hover:bg-white/25 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Stat bar */}
      <div className="relative border-t border-white/15 bg-brand-950/25 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl sm:text-3xl font-bold text-white">{s.value}</div>
              <div className="text-xs sm:text-sm text-brand-200 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
