'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bookmark, CalendarDays, ExternalLink, Loader2, Send, Trophy, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { categoryMeta, deadlineInfo } from '@/lib/opportunity-display'
import Modal, { ModalSummary } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

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

type Dialog = { kind: 'submit' | 'result' | 'remove'; item: PipelineItem } | null

const STAGES: { id: Stage; title: string; help: string; pill: string }[] = [
  { id: 'SAVED', title: 'Saved', help: 'Decide what to pursue', pill: 'pill-slate' },
  { id: 'PREPARING', title: 'Preparing', help: 'Gather documents', pill: 'pill-amber' },
  { id: 'SUBMITTED', title: 'Submitted', help: 'Record the outcome', pill: 'pill-blue' },
  { id: 'INTERVIEW', title: 'Interview', help: 'Prepare for the next step', pill: 'pill-violet' },
  { id: 'RESULT', title: 'Result', help: 'Keep a record', pill: 'pill-green' },
]

const NEXT: Partial<Record<Stage, { status: ApplicationStatus; label: string }>> = {
  SAVED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'SUBMITTED', label: 'Mark submitted' },
  SUBMITTED: { status: 'INTERVIEW', label: 'Move to interview' },
  INTERVIEW: { status: 'RESULT', label: 'Record result' },
}

const OUTCOMES = ['Accepted', 'Waitlisted', 'Declined', 'Withdrawn']

export default function SavedPipeline() {
  const [saved, setSaved] = useState<SavedEntry[]>([])
  const [applications, setApplications] = useState<ApplicationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [outcome, setOutcome] = useState('')
  const [outcomeNote, setOutcomeNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)

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

  function openDialog(kind: NonNullable<Dialog>['kind'], item: PipelineItem) {
    setOutcome('')
    setOutcomeNote('')
    setConfirmed(false)
    setDialog({ kind, item })
  }

  /** Buttons route through here: steps that matter get a confirmation pop-up first. */
  function requestAdvance(item: PipelineItem, directResult = false) {
    const next = directResult ? 'RESULT' : NEXT[item.stage]?.status
    if (next === 'SUBMITTED') return openDialog('submit', item)
    if (next === 'RESULT') return openDialog('result', item)
    if (next) void move(item, next)
  }

  async function move(item: PipelineItem, status: ApplicationStatus, notes?: string) {
    setBusyId(item.opportunity.id)
    try {
      const response = item.application
        ? await fetch(`/api/applications/${item.application.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, ...(notes ? { notes } : {}) }),
          })
        : await fetch('/api/applications', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opportunityId: item.opportunity.id }),
          })
      if (!response.ok && response.status !== 409) throw new Error('Could not update this opportunity')
      await reload()
      toast.success(response.status === 409 ? 'Already in your tracker' : `Moved to ${status.toLowerCase()}`)
      setDialog(null)
    } catch {
      toast.error('Could not update this opportunity. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  function saveResult(item: PipelineItem) {
    const text = [outcome, outcomeNote.trim()].filter(Boolean).join(' - ')
    if (!text) {
      toast.error('Choose or describe the result first.')
      return
    }
    const notes = `${item.application?.notes ? `${item.application.notes}\n` : ''}Outcome: ${text.slice(0, 200)}`
    void move(item, 'RESULT', notes)
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
      setDialog(null)
    } catch {
      toast.error('Could not remove this opportunity. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const dialogItem = dialog?.item
  const dialogBusy = !!dialogItem && busyId === dialogItem.opportunity.id
  const dialogChecklist = dialogItem?.application?.checklist ?? []
  const dialogDocs = `${dialogChecklist.filter((c) => c.completed).length} of ${dialogChecklist.length} ready`

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Opportunity pipeline</h1>
          <p className="text-ink-500 mt-1">Move saved opportunities from shortlist to result, with documents and deadlines in view.</p>
        </div>
        <Link href="/opportunities" className="btn-primary !rounded-full">Find opportunities <ArrowRight className="h-4 w-4" /></Link>
      </div>
      {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => reload().catch(() => {})}>Retry</button></div>}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
      ) : items.length === 0 ? (
        <div className="dash-panel p-12 text-center">
          <span className="mx-auto h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><Bookmark className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-semibold text-ink-900">Nothing in your pipeline yet</h2>
          <p className="mt-1 text-sm text-ink-500">Save a scholarship, job, or internship to start your shortlist.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4" aria-label="Opportunity pipeline">
          <div className="grid grid-cols-5 gap-4 min-w-[1080px]">
            {STAGES.map((stage) => {
              const column = items.filter((item) => item.stage === stage.id)
              return (
                <section key={stage.id} aria-label={`${stage.title}, ${column.length} opportunities`} className="rounded-3xl bg-white/60 ring-1 ring-surface-200 p-3 min-h-[240px]">
                  <div className="flex items-center justify-between gap-2 px-1">
                    <h2 className={cn('status-pill !text-xs', stage.pill)}>{stage.title}</h2>
                    <span className="rounded-full bg-white ring-1 ring-surface-200 px-2 py-0.5 text-xs font-semibold text-ink-600">{column.length}</span>
                  </div>
                  <p className="px-1 mt-2 mb-3 text-xs text-ink-400">{stage.help}</p>
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
                        <article key={opportunity.id} className="rounded-2xl bg-white ring-1 ring-surface-200 p-4 shadow-soft hover:shadow-premium transition-shadow">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${category.chip}`}>{category.label}</span>
                          <h3 className="mt-2 text-sm font-semibold leading-snug text-ink-900 line-clamp-3">{opportunity.title}</h3>
                          <p className="mt-1 text-xs text-ink-500 line-clamp-1">{opportunity.hostOrg}</p>
                          <p className={`mt-3 flex items-center gap-1 text-xs font-medium ${deadline.tone}`}><CalendarDays className="h-3.5 w-3.5" /> {deadline.label}</p>
                          {item.application && checklist.length > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-[11px] text-ink-500"><span>Documents</span><span>{completed}/{checklist.length}</span></div>
                              <div className="mt-1 h-1.5 rounded-full bg-surface-100 overflow-hidden">
                                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(completed / checklist.length) * 100}%` }} />
                              </div>
                            </div>
                          )}
                          {item.stage === 'RESULT' && item.application?.notes && <p className="mt-2 text-xs text-ink-600 whitespace-pre-wrap">{item.application.notes}</p>}
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs">
                            <Link href={category.href(opportunity.id)} className="font-semibold text-brand-700 hover:underline">Details</Link>
                            {item.application && <Link href="/dashboard/applications" className="font-semibold text-brand-700 hover:underline">Checklist</Link>}
                            {safeApplicationLink && <a href={safeApplicationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">Apply <ExternalLink className="h-3 w-3" /></a>}
                          </div>
                          {next && <button type="button" disabled={busyId === opportunity.id} onClick={() => requestAdvance(item)} className="mt-4 w-full rounded-full bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">{busyId === opportunity.id ? 'Updating…' : next.label}</button>}
                          {item.stage === 'SUBMITTED' && <button type="button" disabled={busyId === opportunity.id} onClick={() => requestAdvance(item, true)} className="mt-2 w-full text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50">Record result without interview</button>}
                          {item.saved && !item.application && <button type="button" disabled={busyId === opportunity.id} onClick={() => openDialog('remove', item)} className="mt-2 w-full text-xs text-ink-400 hover:text-red-600 disabled:opacity-50">Remove from saved</button>}
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

      {/* Mark submitted */}
      <Modal
        open={dialog?.kind === 'submit'}
        onClose={() => setDialog(null)}
        title="Mark as submitted?"
        description="Do this once you have sent the application on the provider's site. Xcel360 does not submit it for you."
        footer={dialogItem && (
          <>
            <button type="button" onClick={() => setDialog(null)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-surface-200 hover:bg-surface-50">Cancel</button>
            <button type="button" disabled={!confirmed || dialogBusy} onClick={() => move(dialogItem, 'SUBMITTED')} className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed">
              <Send className="h-4 w-4" /> {dialogBusy ? 'Saving…' : 'Mark submitted'}
            </button>
          </>
        )}
      >
        {dialogItem && (
          <div className="space-y-4">
            <ModalSummary
              header={<><p className="font-semibold text-ink-900 text-sm">{dialogItem.opportunity.title}</p><p className="text-xs text-ink-500">{dialogItem.opportunity.hostOrg}</p></>}
              rows={[
                { label: 'Deadline', value: <span className={deadlineInfo(dialogItem.opportunity.deadline).tone}>{deadlineInfo(dialogItem.opportunity.deadline).label}</span> },
                { label: 'Documents', value: dialogChecklist.length ? dialogDocs : 'No checklist' },
                { label: 'Next stage', value: <span className="status-pill pill-blue">Submitted</span> },
              ]}
            />
            <label className="flex items-center gap-3 text-sm text-ink-700 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
              I have sent this application to the provider
            </label>
          </div>
        )}
      </Modal>

      {/* Record result */}
      <Modal
        open={dialog?.kind === 'result'}
        onClose={() => setDialog(null)}
        title="Record the result"
        description="Keep a record of how this application went. You can add a short note."
        footer={dialogItem && (
          <>
            <button type="button" onClick={() => setDialog(null)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-surface-200 hover:bg-surface-50">Cancel</button>
            <button type="button" disabled={dialogBusy} onClick={() => saveResult(dialogItem)} className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
              <Trophy className="h-4 w-4" /> {dialogBusy ? 'Saving…' : 'Save result'}
            </button>
          </>
        )}
      >
        {dialogItem && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-ink-900">{dialogItem.opportunity.title}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Outcome">
              {OUTCOMES.map((o) => (
                <button
                  key={o} type="button" role="radio" aria-checked={outcome === o} onClick={() => setOutcome(o)}
                  className={cn('rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors',
                    outcome === o ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-700 ring-surface-200 hover:bg-surface-50')}
                >
                  {o}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="outcome-note" className="text-xs font-semibold text-ink-600">Note (optional)</label>
              <input
                id="outcome-note" value={outcomeNote} maxLength={160} onChange={(e) => setOutcomeNote(e.target.value)}
                placeholder="For example: full funding, starts September"
                className="mt-1 w-full rounded-xl bg-surface-50 ring-1 ring-surface-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-brand-400"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Remove from saved */}
      <Modal
        open={dialog?.kind === 'remove'}
        onClose={() => setDialog(null)}
        size="sm"
        title="Remove from saved?"
        description={dialogItem ? <>&ldquo;{dialogItem.opportunity.title}&rdquo; will leave your pipeline. You can save it again from its page.</> : undefined}
        footer={dialogItem && (
          <>
            <button type="button" onClick={() => setDialog(null)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-surface-200 hover:bg-surface-50">Keep it</button>
            <button type="button" disabled={dialogBusy} onClick={() => removeSaved(dialogItem)} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40">
              <Trash2 className="h-4 w-4" /> {dialogBusy ? 'Removing…' : 'Remove'}
            </button>
          </>
        )}
      />
    </div>
  )
}
