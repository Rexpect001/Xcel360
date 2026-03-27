'use client'
import { useState, useMemo, lazy, Suspense } from 'react'
import { Opportunity } from '@prisma/client'
import { Search, SlidersHorizontal, X, Bookmark, ExternalLink, LayoutGrid, Map } from 'lucide-react'
import { Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { formatDate, daysUntilDeadline, getFundingBadgeColor, cn } from '@/lib/utils'
import { PROGRAM_LEVELS, FIELDS, FUNDING_TYPES, COUNTRIES } from '@/types'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

const ScholarshipMap = lazy(() => import('./ScholarshipMap'))

interface Props {
  initialOpportunities: Opportunity[]
}

export default function OpportunitiesClient({ initialOpportunities }: Props) {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    programLevel: '',
    field: '',
    country: '',
    fundingType: '',
    sortBy: 'deadline',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  const filtered = useMemo(() => {
    let result = initialOpportunities

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.hostOrg.toLowerCase().includes(q) ||
          o.country.toLowerCase().includes(q) ||
          o.fieldTags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (filters.programLevel) {
      result = result.filter((o) => o.programLevel.includes(filters.programLevel))
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

    if (filters.sortBy === 'deadline') {
      result = [...result].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    } else if (filters.sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (filters.sortBy === 'featured') {
      result = [...result].sort((a, b) => Number(b.featured) - Number(a.featured))
    }

    return result
  }, [initialOpportunities, search, filters])

  const clearFilters = () => {
    setSearch('')
    setFilters({ programLevel: '', field: '', country: '', fundingType: '', sortBy: 'deadline' })
  }

  const hasFilters = search || filters.programLevel || filters.field || filters.country || filters.fundingType

  const handleSave = async (opportunityId: string) => {
    if (!session) {
      toast.error('Sign in to save opportunities')
      return
    }
    setSaving(opportunityId)
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      })
      if (res.ok) toast.success('Saved to your dashboard!')
      else toast.error('Already saved or error occurred')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search scholarships, universities, countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
            showFilters ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
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
            className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors', viewMode === 'list' ? 'bg-brand-700 text-white' : 'text-gray-600 hover:bg-gray-50')}
          >
            <LayoutGrid className="h-4 w-4" /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors', viewMode === 'map' ? 'bg-brand-700 text-white' : 'text-gray-600 hover:bg-gray-50')}
          >
            <Map className="h-4 w-4" /> Map
          </button>
        </div>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
          className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
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
      <p className="text-sm text-gray-500 mb-4">{filtered.length} opportunit{filtered.length !== 1 ? 'ies' : 'y'} found</p>

      {/* Map view */}
      {viewMode === 'map' && (
        <Suspense fallback={<div className="h-[520px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">Loading map...</div>}>
          <ScholarshipMap opportunities={filtered} />
        </Suspense>
      )}

      {/* Grid */}
      {viewMode === 'list' && filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium text-gray-500">No results found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
          <button onClick={clearFilters} className="mt-4 text-brand-600 text-sm font-medium">Clear filters</button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((opp) => {
            const days = daysUntilDeadline(opp.deadline)
            return (
              <div
                key={opp.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFundingBadgeColor(opp.fundingType)}`}>
                      {opp.fundingType}
                    </span>
                    {opp.status === 'OPEN' ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Open</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Closed</span>
                    )}
                  </div>

                  <Link href={`/opportunities/${opp.id}`} className="flex-1">
                    <h3 className="font-semibold text-gray-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2 mb-1">
                      {opp.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{opp.hostOrg}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {opp.programLevel.slice(0, 2).map((l) => <Badge key={l} variant="blue">{l}</Badge>)}
                      <Badge variant="gray">{opp.field}</Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opp.country}</span>
                      <span className={`flex items-center gap-1 font-medium ${days <= 30 ? 'text-orange-500' : 'text-gray-500'}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        {days > 0 ? `${days}d left` : 'Closed'}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="flex-1 text-center py-2 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
                    >
                      View details
                    </Link>
                    <button
                      onClick={() => handleSave(opp.id)}
                      disabled={saving === opp.id}
                      className="p-2 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
                      title="Save opportunity"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                    {opp.applicationLink && (
                      <a
                        href={opp.applicationLink.startsWith('http') ? opp.applicationLink : `https://${opp.applicationLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Apply"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
