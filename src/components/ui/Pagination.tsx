'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** Condensed page numbers with ellipses: 1 … 4 5 [6] 7 8 … 12 */
function pageWindow(page: number, totalPages: number): (number | 'ellipsis')[] {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1])
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const goTo = (p: number) => {
    onPageChange(Math.min(Math.max(p, 1), totalPages))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="w-8 text-center text-sm text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'w-9 h-9 rounded-xl text-sm font-medium transition-colors',
                p === page ? 'bg-ink-900 text-white' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
              )}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => goTo(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
