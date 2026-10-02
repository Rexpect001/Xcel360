'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, ShieldCheck, CalendarCheck, PenLine } from 'lucide-react'
import BrandPattern from '@/components/brand/BrandPattern'

const popularSearches = ['Fully funded masters', 'Chevening', 'DAAD Germany', 'PhD in public health', 'Erasmus Mundus']

/**
 * Search-first hero. One promise, one search box - the query is matched
 * against title, organisation, tags, description and eligibility, so no
 * filters are required to get going.
 */
export default function Hero({ liveCount }: { liveCount?: number }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const goSearch = (term: string) => {
    router.push(`/opportunities${term.trim() ? `?search=${encodeURIComponent(term.trim())}` : ''}`)
  }

  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white">
      <BrandPattern opacity={0.1} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20 sm:pt-40 sm:pb-24 text-center">
        <p className="eyebrow !text-accent-200 mb-5">
          {liveCount ? `${liveCount.toLocaleString()} live opportunities, checked daily` : 'Scholarships, checked daily'}
        </p>
        <h1 className="font-display text-[2.6rem] leading-[1.05] sm:text-6xl md:text-7xl text-white">
          Your education,
          <br />
          <em className="not-italic text-accent-200">fully funded.</em>
        </h1>
        <p className="text-base sm:text-lg text-brand-100 max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
          Find scholarships you actually qualify for, track every deadline, and write a stronger
          application, all in one place.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); goSearch(query) }}
          role="search"
          className="max-w-2xl mx-auto"
        >
          <label htmlFor="hero-search" className="sr-only">Search scholarships</label>
          <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
            <Search className="h-5 w-5 ml-3.5 text-ink-300 shrink-0" />
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “masters in data science, Germany”"
              className="flex-1 px-3 py-3 text-[15px] text-ink-900 bg-transparent focus:outline-none placeholder:text-ink-300 min-w-0"
            />
            <button type="submit" className="btn-primary !rounded-xl !px-5 sm:!px-7 shrink-0">
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2 mt-5">
            <span className="text-xs text-brand-100">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => goSearch(term)}
                className="text-xs px-3 py-1.5 rounded-full text-brand-50 border border-white/20 hover:bg-white/10 hover:text-white transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </form>

        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-3xl mx-auto">
          {[
            { icon: ShieldCheck, title: 'Verified links', text: 'Every listing points to the official provider.' },
            { icon: CalendarCheck, title: 'Deadline alerts', text: 'Reminders at 30, 14, 7 and 2 days out.' },
            { icon: PenLine, title: 'Writing tools', text: 'CV, SOP and cover letters, drafted with you.' },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
              <Icon className="h-5 w-5 text-accent-200 shrink-0 mt-0.5" />
              <span>
                <span className="block text-sm font-semibold text-white">{title}</span>
                <span className="block text-xs text-brand-100 mt-0.5">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
