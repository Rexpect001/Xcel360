'use client'
import { useState, useMemo, useEffect, lazy, Suspense, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, LayoutGrid, Map, GraduationCap, Briefcase, Building2 } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
import OpportunityCard from '@/components/opportunities/OpportunityCard'
import GoogleAd from '@/components/ads/GoogleAd'
import { daysUntilDeadline, cn } from '@/lib/utils'
import { matchesLevel } from '@/lib/opportunity-display'
import { tokenizeQuery, searchScore } from '@/lib/opportunitySearch'
import { PROGRAM_LEVELS, FIELDS, FUNDING_TYPES, COUNTRIES } from '@/types'
import type { OpportunityListItem } from '@/types/opportunity-list'

const ScholarshipMap = lazy(() => import('./ScholarshipMap'))

const PAGE_SIZE = 20

interface Props {
  initialOpportunities: OpportunityListItem[]
}

export default function OpportunitiesClient({ initialOpportunities }: Props) {
  // Deep-linkable filters - hero search, "Choose Your Path" and category cards
  // land here with ?search=, ?level=, ?field=, ?funding=, ?country=, ?soon=
  const searchParams = useSearchParams()
  const soonDays = searchParams.get('soon')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [category, setCategory] = useState<'ALL' | 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP'>('ALL')
  const [filters, setFilters] = useState({
    programLevel: searchParams.get('level') ?? '',
    field: searchParams.get('field') ?? '',
    country: searchParams.get('country') ?? '',
    fundingType: searchParams.get('funding') ?? '',
    sortBy: searchParams.get('sort') ?? (searchParams.get('search') ? 'relevance' : 'deadline'),
  })
  const [showFilters, setShowFilters] = useState(
    Boolean(searchParams.get('level') || searchParams.get('field') || searchParams.get('funding') || searchParams.get('country') || soonDays)
  )
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = initialOpportunities

    if (category !== 'ALL') {
      result = result.filter((o) => (o as any).category === category)
    }

    // Google-style keyword search - no country/level/field required. The query is
    // split into keywords and matched (and ranked) across every searchable field,
    // including the full description and eligibility text.
    let scores: Record<string, number> | null = null
    const keywords = tokenizeQuery(search)
    if (keywords.length > 0) {
      scores = {}
      result = result.filter((o) => {
        const score = searchScore(o, keywords)
        if (score > 0) scores![o.id] = score
        return score > 0
      })
    }

    if (filters.programLevel) {
      result = result.filter((o) => matchesLevel(o.programLevel, filters.programLevel))
    }
    if (filters.field) {
      result = result.filter((o) => o.field === filters.field)
    }
    if (filters.country) {
      result = result.filter((o) => o.country === filters.country)
    }
    if (filters.fundingType) {
      result = result.filter((o) => o.fundingType === filters.fundingType)
    }

    // ?soon=N - only opportunities closing within N days
    if (soonDays) {
      const within = parseInt(soonDays, 10)
      if (!Number.isNaN(within)) {
        result = result.filter((o) => {
          const d = daysUntilDeadline(o.deadline)
          return d !== null && d >= 0 && d <= within
        })
      }
    }

    if (filters.sortBy === 'relevance' && scores) {
      result = [...result].sort((a, b) => (scores![b.id] ?? 0) - (scores![a.id] ?? 0))
    } else if (filters.sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (filters.sortBy === 'featured') {
      result = [...result].sort((a, b) => Number(b.featured) - Number(a.featured))
    } else {
      // Soonest first; rolling (no deadline) listings go last
      const t = (d: Date | string | null) => (d ? new Date(d).getTime() : Number.MAX_SAFE_INTEGER)
      result = [...result].sort((a, b) => t(a.deadline) - t(b.deadline))
    }

    return result
  }, [initialOpportunities, search, filters, category, soonDays])

  // Reset to page 1 whenever the result set changes underneath the pager
  useEffect(() => {
    setPage(1)
  }, [search, filters, category, soonDays])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  const clearFilters = () => {
    setSearch('')
    setCategory('ALL')
    setFilters((f) => ({ programLevel: '', field: '', country: '', fundingType: '', sortBy: f.sortBy }))
  }

  const hasFilters = search || category !== 'ALL' || filters.programLevel || filters.field || filters.country || filters.fundingType

  const CATEGORY_TABS = [
    { key: 'ALL' as const, label: 'All', icon: null },
    { key: 'SCHOLARSHIP' as const, label: 'Scholarships', icon: <GraduationCap className="h-4 w-4" /> },
    { key: 'JOB' as const, label: 'Jobs', icon: <Briefcase className="h-4 w-4" /> },
    { key: 'INTERNSHIP' as const, label: 'Internships', icon: <Building2 className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {CATEGORY_TABS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setCategory(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border',
              category === key
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-white text-ink-600 border-surface-200 hover:border-ink-300 hover:text-ink-900'
            )}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything - keywords, field, country, eligibility..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 bg-white shadow-soft"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
            showFilters ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-surface-200 hover:border-ink-300'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasFilters && <span className="w-2 h-2 bg-orange-400 rounded-full" />}
        </button>
        {/* List / Map toggle */}
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setViewMode('list')}
            className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors', viewMode === 'list' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-surface-50')}
          >
            <LayoutGrid className="h-4 w-4" /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors', viewMode === 'map' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-surface-50')}
          >
            <Map className="h-4 w-4" /> Map
          </button>
        </div>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
          className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          {search.trim() && <option value="relevance">Best match</option>}
          <option value="deadline">Soonest Deadline</option>
          <option value="newest">Newest</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Program Level</label>
              <select
                value={filters.programLevel}
                onChange={(e) => setFilters((f) => ({ ...f, programLevel: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All levels</option>
                {PROGRAM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Field</label>
              <select
                value={filters.field}
                onChange={(e) => setFilters((f) => ({ ...f, field: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All fields</option>
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Country</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All countries</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Funding Type</label>
              <select
                value={filters.fundingType}
                onChange={(e) => setFilters((f) => ({ ...f, fundingType: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All types</option>
                {FUNDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 flex items-center gap-1 text-sm text-red-500 hover:text-red-600">
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-ink-500 mb-4" aria-live="polite">
        {filtered.length} opportunit{filtered.length !== 1 ? 'ies' : 'y'} found
        {viewMode === 'list' && totalPages > 1 && (
          <span className="text-gray-400"> · page {page} of {totalPages}</span>
        )}
      </p>

      {/* Map view */}
      {viewMode === 'map' && (
        <Suspense fallback={<div className="h-[520px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">Loading map...</div>}>
          <ScholarshipMap opportunities={filtered} />
        </Suspense>
      )}

      {/* Grid - shared snapshot cards with an ad after every 6th result */}
      {viewMode === 'list' && filtered.length === 0 ? (
        <div className="text-center py-20 paper-card">
          <Search className="h-10 w-10 mx-auto mb-3 text-ink-200" />
          <p className="text-lg font-semibold text-ink-800">No results yet</p>
          <p className="text-sm mt-1 text-ink-500">Try fewer keywords, or clear a filter.</p>
          <button onClick={clearFilters} className="mt-4 text-brand-700 text-sm font-semibold hover:underline">Clear all filters</button>
        </div>
      ) : viewMode === 'list' ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((opp, i) => (
              <Fragment key={opp.id}>
                <OpportunityCard opp={opp} />
                {(i + 1) % 6 === 0 && i < paginated.length - 1 && (
                  <GoogleAd placement="listing-infeed" className="sm:col-span-2 lg:col-span-3" />
                )}
              </Fragment>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  )
}
