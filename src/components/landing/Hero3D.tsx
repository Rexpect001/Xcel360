'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

const popularSearches = ['Fulbright', 'DAAD Germany', 'Commonwealth', 'Gates Cambridge', 'Erasmus+']

export default function Hero3D() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/opportunities${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <section
      className="py-16 border-t border-gray-100"
      style={{ background: 'linear-gradient(160deg, #f0f9ff 0%, #e0f2fe 50%, #f8faff 100%)' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ color: '#0c4a6e' }}>
          Find Your Dream Opportunity
        </h2>
        <p className="text-sm mb-7" style={{ color: '#475569' }}>
          Search 2,700+ scholarships, grants, fellowships, jobs and internships for African students
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch}>
          <div className="flex bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 24px rgba(3,105,161,0.1), 0 1px 4px rgba(0,0,0,0.05)', border: '1.5px solid rgba(3,105,161,0.15)' }}>
            <div className="flex items-center pl-5 flex-shrink-0" style={{ color: '#94a3b8' }}>
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opportunity, country, or field..."
              className="flex-1 px-4 py-4 text-sm focus:outline-none placeholder:text-gray-400 min-w-0"
              style={{ color: '#0f172a' }}
            />
            <button type="submit"
              className="px-6 py-4 font-semibold text-sm text-white flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}>
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Popular searches */}
          <div className="flex items-center justify-center flex-wrap gap-2 mt-3">
            <span className="text-xs" style={{ color: '#475569' }}>Popular:</span>
            {popularSearches.map((term) => (
              <button key={term} type="button"
                onClick={() => router.push(`/opportunities?search=${encodeURIComponent(term)}`)}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={{ color: '#0369a1', border: '1px solid rgba(3,105,161,0.25)', background: 'rgba(240,249,255,0.8)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(3,105,161,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(240,249,255,0.8)' }}>
                {term}
              </button>
            ))}
          </div>
        </form>

      </div>
    </section>
  )
}
