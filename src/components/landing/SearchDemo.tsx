'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Search, SlidersHorizontal, Bookmark, BookmarkCheck, Bell, MousePointer2, Pause, Play, RotateCcw, CalendarClock, MapPin, GraduationCap, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Animated walkthrough of searching on Xcel360. A scripted timeline drives a
 * mock browser window through four steps: type, filter, review, save.
 * Fully client-side, no video file, pausable, and static under reduced motion.
 */

const QUERY = 'masters in public health'
const STEPS = [
  { title: 'Type what you want', text: 'Plain words work. Course, country, level or a scholarship name.' },
  { title: 'Narrow with filters', text: 'Pick your level and funding type to cut the noise.' },
  { title: 'Compare at a glance', text: 'Every card shows level, destination, funding and deadline the same way.' },
  { title: 'Save and get reminded', text: 'One tap saves it. We remind you before the deadline.' },
]

const RESULTS = [
  { org: 'GS', host: 'Global Health Trust', title: 'Global Health Leaders Masters Scholarship', country: 'United Kingdom', date: '14 Dec', left: '73 days left', tone: 'text-emerald-700', match: 92 },
  { org: 'ER', host: 'Erasmus+', title: 'Erasmus Mundus Joint Masters in Public Health', country: 'Europe', date: '15 Jan', left: '105 days left', tone: 'text-emerald-700', match: 88 },
  { org: 'DA', host: 'DAAD', title: 'DAAD EPOS Development-Related Postgraduate Course', country: 'Germany', date: '31 Oct', left: '29 days left', tone: 'text-amber-700', match: 81 },
]

// Timeline: [phase, duration ms]
type Phase = 'idle' | 'typing' | 'filter' | 'results' | 'cursor' | 'saved' | 'reminder'
const TIMELINE: [Phase, number][] = [
  ['idle', 700],
  ['typing', QUERY.length * 70 + 500],
  ['filter', 1800],
  ['results', 2200],
  ['cursor', 1300],
  ['saved', 1600],
  ['reminder', 2800],
]
const stepOf = (p: Phase) => (p === 'idle' || p === 'typing' ? 0 : p === 'filter' ? 1 : p === 'results' ? 2 : 3)
const order: Phase[] = TIMELINE.map(([p]) => p)
const atLeast = (p: Phase, q: Phase) => order.indexOf(p) >= order.indexOf(q)

export default function SearchDemo({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion()
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [typed, setTyped] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const phase: Phase = reduce ? 'reminder' : TIMELINE[phaseIdx][0]
  const step = stepOf(phase)

  // Only animate while on screen
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Advance the timeline
  useEffect(() => {
    if (reduce || !playing || !inView) return
    const t = setTimeout(() => {
      setPhaseIdx((i) => {
        const next = (i + 1) % TIMELINE.length
        if (next === 0) setTyped(0)
        return next
      })
    }, TIMELINE[phaseIdx][1])
    return () => clearTimeout(t)
  }, [phaseIdx, playing, inView, reduce])

  // Typewriter
  useEffect(() => {
    if (reduce || phase !== 'typing' || !playing) return
    if (typed >= QUERY.length) return
    const t = setTimeout(() => setTyped((n) => n + 1), 70)
    return () => clearTimeout(t)
  }, [phase, typed, playing, reduce])

  const shownQuery = reduce || atLeast(phase, 'filter') ? QUERY : QUERY.slice(0, typed)
  const filtersOn = atLeast(phase, 'filter')
  const showResults = atLeast(phase, 'results')
  const saved = atLeast(phase, 'saved')

  const jump = (s: number) => {
    const target = s === 0 ? 1 : s === 1 ? 2 : s === 2 ? 3 : 5
    setTyped(QUERY.length)
    setPhaseIdx(target)
  }

  return (
    <div ref={rootRef} className={cn('grid gap-8 items-center', compact ? 'lg:grid-cols-1' : 'lg:grid-cols-[320px_minmax(0,1fr)]')}>
      {/* Steps */}
      <ol className={cn('space-y-2', compact && 'hidden')}>
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => jump(i)}
              className={cn(
                'w-full text-left flex gap-4 rounded-2xl p-4 transition-colors border',
                step === i ? 'bg-white border-surface-200 shadow-soft' : 'border-transparent hover:bg-white/60'
              )}
            >
              <span className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
                step === i ? 'bg-brand-600 text-accent-200' : step > i ? 'bg-accent-200 text-ink-900' : 'bg-surface-200 text-ink-500'
              )}>
                {i + 1}
              </span>
              <span>
                <span className={cn('block font-semibold', step === i ? 'text-ink-900' : 'text-ink-600')}>{s.title}</span>
                <span className="block text-sm text-ink-500 mt-0.5 leading-relaxed">{s.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {/* Mock browser */}
      <div className="relative">
        <div className="rounded-2xl border border-surface-200 bg-white shadow-premium overflow-hidden" aria-hidden>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-100 bg-surface-50">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            <span className="ml-3 flex-1 max-w-xs text-[11px] text-ink-400 bg-white border border-surface-200 rounded-md px-2.5 py-1 truncate">
              thexcel360.com/opportunities
            </span>
          </div>

          <div className="p-4 sm:p-6 min-h-[430px] bg-surface-50 relative">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className={cn('flex-1 flex items-center gap-2 bg-white border rounded-xl px-3.5 py-3 transition-colors', phase === 'typing' ? 'border-accent-400 ring-2 ring-accent-200' : 'border-surface-200')}>
                <Search className="h-4 w-4 text-ink-300" />
                <span className="text-sm text-ink-900">
                  {shownQuery || <span className="text-ink-300">Search scholarships…</span>}
                  {phase === 'typing' && <span className="inline-block w-px h-4 bg-brand-600 align-middle ml-px animate-pulse" />}
                </span>
              </div>
              <span className={cn('hidden sm:flex items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold border transition-colors', filtersOn ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-600 border-surface-200')}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              </span>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mt-3 min-h-[30px]">
              <AnimatePresence>
                {filtersOn && ['Level: Masters', 'Funding: Fully funded', 'Field: Medicine'].map((c, i) => (
                  <motion.span
                    key={c}
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: reduce ? 0 : i * 0.35 }}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-accent-100 text-ink-800 border border-accent-200"
                  >
                    {c}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {/* Results */}
            <div className="mt-4 space-y-3">
              <AnimatePresence>
                {showResults && RESULTS.map((r, i) => (
                  <motion.div
                    key={r.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: reduce ? 0 : i * 0.25, duration: 0.35 }}
                    className={cn('bg-white rounded-xl border p-3.5 flex gap-3 items-start transition-shadow', i === 0 && atLeast(phase, 'cursor') ? 'border-ink-200 shadow-soft' : 'border-surface-200')}
                  >
                    <span className="w-9 h-9 rounded-lg bg-brand-600 text-accent-200 text-xs font-display font-semibold flex items-center justify-center shrink-0">{r.org}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-ink-400 font-semibold truncate">{r.host}</span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{r.match}% match</span>
                      </div>
                      <p className="text-[13px] font-bold text-ink-900 truncate mt-0.5">{r.title}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10.5px] text-ink-500 font-medium">
                        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />Masters</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.country}</span>
                        <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />Fully funded</span>
                        <span className={cn('flex items-center gap-1 font-bold', r.tone)}><CalendarClock className="h-3 w-3" />{r.date} · {r.left}</span>
                      </div>
                    </div>
                    <span className={cn('p-1.5 rounded-lg shrink-0 transition-colors', i === 0 && saved ? 'bg-emerald-50 text-emerald-600' : 'text-ink-300')}>
                      {i === 0 && saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Cursor */}
            {!reduce && (
              <motion.div
                className="absolute z-10 pointer-events-none"
                initial={false}
                animate={
                  phase === 'cursor' || phase === 'saved'
                    ? { opacity: 1, right: 34, top: 188 }
                    : phase === 'filter'
                    ? { opacity: 1, right: 60, top: 40 }
                    : { opacity: 0, right: 140, top: 300 }
                }
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                <MousePointer2 className="h-5 w-5 text-ink-900 fill-white drop-shadow" />
              </motion.div>
            )}

            {/* Toast + reminder */}
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="absolute left-4 right-4 sm:left-auto sm:right-6 bottom-5 sm:w-80 rounded-xl bg-brand-600 text-white p-3.5 shadow-premium"
                >
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <BookmarkCheck className="h-4 w-4 text-accent-200" /> Saved to your dashboard
                  </p>
                  {atLeast(phase, 'reminder') && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-brand-100 mt-1.5 flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-accent-200" /> Reminders set for 30, 14, 7 and 2 days before 14 Dec
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        {!reduce && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5" role="tablist" aria-label="Walkthrough steps">
              {STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={step === i}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => jump(i)}
                  className={cn('h-1.5 rounded-full transition-all', step === i ? 'w-8 bg-brand-600' : 'w-3 bg-surface-300 hover:bg-ink-300')}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setTyped(0); setPhaseIdx(0); setPlaying(true) }}
                className="p-2 rounded-lg text-ink-500 hover:bg-white hover:text-ink-900"
                aria-label="Restart walkthrough"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-700 hover:bg-white"
                aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'}
              >
                {playing ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Play</>}
              </button>
            </div>
          </div>
        )}
        <p className="sr-only">
          Walkthrough: 1. Type what you want into the search box. 2. Narrow results with level and funding filters.
          3. Compare cards showing level, destination, funding and deadline. 4. Save a scholarship to get deadline reminders.
        </p>
      </div>
    </div>
  )
}
