'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

const popularSearches = ['Fulbright', 'DAAD Germany', 'Commonwealth', 'Erasmus+', 'Chevening']

/**
 * Search-first hero - the landing page opens as a "search room": headline,
 * one promise, one Google-style search box (no country/level/field required -
 * the query is matched against title, org, tags, description and eligibility
 * server-side, see OpportunitiesClient's keyword scorer), a few popular
 * shortcuts, with a faint animated line pattern washed across the background.
 */
export default function Hero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const goSearch = (term: string) => {
    router.push(`/opportunities${term.trim() ? `?search=${encodeURIComponent(term.trim())}` : ''}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    goSearch(query)
  }

  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white">
      {/* Dot-grid texture for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Color blooms - blue core, gold + violet hints for a livelier gradient */}
      <div className="pointer-events-none absolute -top-32 -right-24 w-[560px] h-[560px] rounded-full bg-brand-300/25 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full bg-brand-900/40 blur-3xl" />
      <div className="pointer-events-none absolute top-10 left-[8%] w-72 h-72 rounded-full bg-accent-400/20 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute bottom-0 right-[12%] w-80 h-80 rounded-full bg-violet-400/15 blur-3xl animate-pulse-slow" />

      {/* Signature background pattern - flowing path lines, not a literal scene */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          viewBox="0 0 1200 500"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full text-white/[0.10] animate-float-slow"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M-50,380 C200,300 400,420 650,340 C900,260 1000,360 1250,300" />
          <path d="M-50,180 C250,240 450,120 700,180 C950,240 1050,140 1250,200" opacity="0.6" />
          <path d="M-50,450 C300,400 550,480 800,420 C1000,380 1100,440 1250,410" opacity="0.4" />
        </svg>
        <div className="absolute top-[34%] left-[18%] w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse-slow" />
        <div className="absolute top-[60%] left-[72%] w-2 h-2 rounded-full bg-accent-300/40 animate-pulse-slow" />
        <div className="absolute top-[20%] left-[56%] w-1.5 h-1.5 rounded-full bg-white/25 animate-pulse-slow" />
        <div className="absolute top-[74%] left-[30%] w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse-slow" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20 sm:pt-36 sm:pb-24 text-center">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
          Your future,
          <br />
          <span className="text-accent-300">fully funded.</span>
        </h1>
        <p className="text-base sm:text-lg text-brand-100 max-w-2xl mx-auto mb-10 leading-relaxed">
          Scholarships, fellowships, jobs and internships - matched to your profile,
          tracked to the deadline, with mentors to guide you all the way.
        </p>

        {/* Google-style search room - just type, no filters required */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex bg-white rounded-2xl overflow-hidden shadow-card-3d">
            <div className="flex items-center pl-5 shrink-0 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “fully funded PhD in public health” or “remote internship”…"
              className="flex-1 px-4 py-4 text-sm sm:text-base text-gray-900 focus:outline-none placeholder:text-gray-400 min-w-0"
            />
            <button
              type="submit"
              className="px-6 sm:px-8 py-4 font-semibold text-sm text-white bg-accent-500 hover:bg-accent-600 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Popular searches */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
            <span className="text-xs text-brand-200">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => goSearch(term)}
                className="text-xs px-3.5 py-1.5 rounded-full text-white border border-white/30 hover:bg-white/15 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  )
}
