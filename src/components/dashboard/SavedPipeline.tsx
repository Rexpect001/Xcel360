'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bookmark, CalendarDays, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { categoryMeta, deadlineInfo } from '@/lib/opportunity-display'

type Stage = 'SAVED' | 'PREPARING' | 'SUBMITTED' | 'INTERVIEW' | 'RESULT'
type ApplicationStatus = 'INTERESTED' | 'PREPARING' | 'SUBMITTED' | 'INTERVIEW' | 'RESULT'

interface Opportunity {
  id: string
  title: string
  category: string
  hostOrg: string
  deadline: string | null
  applicationLink: string | null
}

interface SavedEntry {
  opportunityId: string
  opportunity: Opportunity
}

interface ApplicationEntry {
  id: string
  opportunityId: string
  opportunity: Opportunity
  status: ApplicationStatus
  notes: string | null
  checklist: { id: string; completed: boolean }[]
}

interface PipelineItem {
  opportunity: Opportunity
  saved: boolean
  application: ApplicationEntry | null
  stage: Stage
}

const STAGES: { id: Stage; title: string; help: string }[] = [
  { id: 'SAVED', title: 'Saved', help: 'Decide what to pursue' },
  { id: 'PREPARING', title: 'Preparing', help: 'Gather documents' },
  { id: 'SUBMITTED', title: 'Submitted', help: 'Record the outcome' },
  { id: 'INTERVIEW', title: 'Interview', help: 'Prepare for the next step' },
  { id: 'RESULT', title: 'Result', help: 'Keep a record' },
]

const NEXT: Partial<Record<Stage, { status: ApplicationStatus; label: string }>> = {
  SAVED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'SUBMITTED', label: 'Mark submitted' },
  SUBMITTED: { status: 'INTERVIEW', label: 'Move to interview' },
  INTERVIEW: { status: 'RESULT', label: 'Record result' },
}

export default function SavedPipeline() {
  const [saved, setSaved] = useState<SavedEntry[]>([])
  const [applications, setApplications] = useState<ApplicationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const [savedResponse, appResponse] = await Promise.all([
      fetch('/api/saved', { cache: 'no-store' }),
      fetch('/api/applications', { cache: 'no-store' }),
    ])
    if (!savedResponse.ok || !appResponse.ok) throw new Error('Could not load your pipeline')
    const [savedData, appData] = await Promise.all([savedResponse.json(), appResponse.json()])
    if (!Array.isArray(savedData) || !Array.isArray(appData)) throw new Error('Invalid pipeline response')
    setSaved(savedData)
    setApplications(appData)
    setError('')
  }, [])

  useEffect(() => {
    reload().catch(() => setError('Could not load your opportunities. Please try again.')).finally(() => setLoading(false))
  }, [reload])

  const items = useMemo(() => {
    const byId = new Map<string, PipelineItem>()
    for (const entry of saved) {
      byId.set(entry.opportunityId, {
        opportunity: entry.opportunity, saved: true, application: null, stage: 'SAVED',
      })
    }
    for (const application of applications) {
      byId.set(application.opportunityId, {
        opportunity: application.opportunity,
        saved: byId.has(application.opportunityId),
        application,
        stage: application.status === 'INTERESTED' ? 'SAVED' : application.status,
      })
    }
    return Array.from(byId.values()).sort((a, b) => {
      const aDate = a.opportunity.deadline ? new Date(a.opportunity.deadline).getTime() : Infinity
      const bDate = b.opportunity.deadline ? new Date(b.opportunity.deadline).getTime() : Infinity
      return aDate - bDate
    })
  }, [saved, applications])

  async function advance(item: PipelineItem, directResult = false) {
    const next = directResult ? { status: 'RESULT' as const, label: 'Record result' } : NEXT[item.stage]
    if (!next) return
    let notes: string | undefined
    if (next.status === 'RESULT') {
      const outcome = window.prompt('What was the result? For example: accepted, declined, or waitlisted.')
      if (outcome === null) return
      if (!outcome.trim()) {
        toast.error('Enter a result before moving this opportunity.')
        return
      }
      notes = `${item.application?.notes ? `${item.application.notes}\n` : ''}Outcome: ${outcome.trim().slice(0, 200)}`
    }
    setBusyId(item.opportunity.id)
    try {
      const response = item.application
        ? await fetch(`/api/applications/${item.application.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: next.status, ...(notes ? { notes } : {}) }),
          })
        : await fetch('/api/applications', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opportunityId: item.opportunity.id }),
          })
      if (!response.ok && response.status !== 409) throw new Error('Could not update this opportunity')
      await reload()
      toast.success(response.status === 409 ? 'Already in your tracker' : `Moved to ${next.status.toLowerCase()}`)
    } catch {
      toast.error('Could not update this opportunity. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  async function removeSaved(item: PipelineItem) {
    setBusyId(item.opportunity.id)
    try {
      const response = await fetch('/api/saved', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: item.opportunity.id }),
      })
      if (!response.ok) throw new Error('Could not remove saved opportunity')
      await reload()
      toast.success('Removed from saved')
    } catch {
      toast.error('Could not remove this opportunity. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Opportunity pipeline</h1>
          <p className="text-ink-500 mt-1">Move saved opportunities from shortlist to result, with documents and deadlines in view.</p>
        </div>
        <Link href="/opportunities" className="btn-primary">Find opportunities <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => reload().catch(() => {})}>Retry</button></div>}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
      ) : items.length === 0 ? (
        <div className="paper-card p-12 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-ink-300" />
          <h2 className="mt-4 text-lg font-semibold text-ink-900">Nothing in your pipeline yet</h2>
          <p className="mt-1 text-sm text-ink-500">Save a scholarship, job, or internship to start your shortlist.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4" aria-label="Opportunity pipeline">
          <div className="grid grid-cols-5 gap-4 min-w-[1080px]">
            {STAGES.map((stage) => {
              const column = items.filter((item) => item.stage === stage.id)
              return (
                <section key={stage.id} aria-label={`${stage.title}, ${column.length} opportunities`} className="rounded-2xl bg-surface-50 border border-surface-200 p-3 min-h-[240px]">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <h2 className="font-semibold text-sm text-ink-900">{stage.title}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-600">{column.length}</span>
                  </div>
                  <p className="px-1 mt-1 mb-3 text-xs text-ink-400">{stage.help}</p>
                  <div className="space-y-3">
                    {column.map((item) => {
                      const opportunity = item.opportunity
                      const category = categoryMeta(opportunity.category)
                      const deadline = deadlineInfo(opportunity.deadline)
                      const checklist = item.application?.checklist ?? []
                      const completed = checklist.filter((check) => check.completed).length
                      const next = NEXT[item.stage]
                      const safeApplicationLink = opportunity.applicationLink?.startsWith('https://') ? opportunity.applicationLink : null
                      return (
                        <article key={opportunity.id} className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${category.chip}`}>{category.label}</span>
                          <h3 className="mt-2 text-sm font-semibold leading-snug text-ink-900 line-clamp-3">{opportunity.title}</h3>
                          <p className="mt-1 text-xs text-ink-500 line-clamp-1">{opportunity.hostOrg}</p>
                          <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${deadline.tone}`}><CalendarDays className="h-3.5 w-3.5" /> {deadline.label}</p>
                          {item.application && <p className="mt-1 text-xs text-ink-500">Documents: {completed}/{checklist.length}</p>}
                          {item.stage === 'RESULT' && item.application?.notes && <p className="mt-2 text-xs text-ink-600 whitespace-pre-wrap">{item.application.notes}</p>}
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs">
                            <Link href={category.href(opportunity.id)} className="font-semibold text-brand-700 hover:underline">Details</Link>
                            {item.application && <Link href="/dashboard/applications" className="font-semibold text-brand-700 hover:underline">Checklist</Link>}
                            {safeApplicationLink && <a href={safeApplicationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">Apply <ExternalLink className="h-3 w-3" /></a>}
                          </div>
                          {next && <button type="button" disabled={busyId === opportunity.id} onClick={() => advance(item)} className="mt-4 w-full rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">{busyId === opportunity.id ? 'Updating…' : next.label}</button>}
                          {item.stage === 'SUBMITTED' && <button type="button" disabled={busyId === opportunity.id} onClick={() => advance(item, true)} className="mt-2 w-full text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50">Record result without interview</button>}
                          {item.saved && !item.application && <button type="button" disabled={busyId === opportunity.id} onClick={() => removeSaved(item)} className="mt-2 w-full text-xs text-ink-400 hover:text-red-600 disabled:opacity-50">Remove from saved</button>}
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
