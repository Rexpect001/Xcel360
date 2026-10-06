'use client'
import { useState, useEffect } from 'react'
import { FileText, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { ApplicationWithOpportunity, APPLICATION_STATUSES } from '@/types'
import { formatDate, daysUntilDeadline } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const PILL: Record<string, string> = {
  INTERESTED: 'pill-slate', PREPARING: 'pill-amber', SUBMITTED: 'pill-blue', INTERVIEW: 'pill-violet', RESULT: 'pill-green',
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<ApplicationWithOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ApplicationWithOpportunity | null>(null)

  useEffect(() => {
    fetch('/api/applications')
      .then((r) => r.json())
      .then((data) => { setApps(data); setLoading(false) })
  }, [])

  const updateStatus = async (appId: string, status: string) => {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setApps((prev) => prev.map((a) => a.id === appId ? updated : a))
      if (selected?.id === appId) setSelected(updated)
      toast.success('Status updated')
    }
  }

  const toggleChecklist = async (appId: string, itemId: string, completed: boolean) => {
    const res = await fetch(`/api/applications/${appId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, completed }),
    })
    if (res.ok) {
      setApps((prev) => prev.map((a) => {
        if (a.id !== appId) return a
        return { ...a, checklist: a.checklist.map((c) => c.id === itemId ? { ...c, completed } : c) }
      }))
      if (selected?.id === appId) {
        setSelected((prev) => prev ? { ...prev, checklist: prev.checklist.map((c) => c.id === itemId ? { ...c, completed } : c) } : null)
      }
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink-900 flex items-center gap-3">Application tracker</h1>
        <p className="text-ink-500 mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''} tracked</p>
      </div>

      {/* Pipeline view */}
      <div className="grid grid-cols-5 gap-3 mb-8 overflow-x-auto pb-2">
        {APPLICATION_STATUSES.map((status) => {
          const count = apps.filter((a) => a.status === status.value).length
          return (
            <div key={status.value} className="dash-panel !rounded-2xl p-4 min-w-28">
              <span className={cn('status-pill', PILL[status.value])}>{status.label}</span>
              <div className="mt-3 font-display text-3xl font-semibold text-ink-900">{count}</div>
            </div>
          )
        })}
      </div>

      {apps.length === 0 ? (
        <div className="dash-panel p-16 text-center">
          <span className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><FileText className="h-7 w-7" /></span>
          <p className="text-ink-500 mb-4">No applications tracked yet. Save an opportunity and start tracking.</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-700">
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* List */}
          <div className="lg:col-span-3 space-y-3">
            {apps.map((app) => {
              const status = APPLICATION_STATUSES.find((s) => s.value === app.status)
              const days = daysUntilDeadline(app.opportunity.deadline)
              const completedItems = app.checklist.filter((c) => c.completed).length
              return (
                <div
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={cn('bg-white rounded-2xl p-5 cursor-pointer transition-all hover:shadow-premium', selected?.id === app.id ? 'ring-2 ring-brand-500 shadow-premium' : 'ring-1 ring-surface-200 shadow-soft')}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-ink-900 text-sm leading-snug line-clamp-2">{app.opportunity.title}</h3>
                    <ChevronRight className="h-4 w-4 text-ink-300 flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-ink-500 mb-3">{app.opportunity.hostOrg}</p>
                  <div className="flex items-center justify-between">
                    <span className={cn('status-pill', PILL[app.status] ?? 'pill-slate')}>{status?.label}</span>
                    <div className="flex items-center gap-3 text-xs text-ink-400">
                      <span>{completedItems}/{app.checklist.length} docs</span>
                      <span className={days <= 7 ? 'text-red-600 font-semibold' : days <= 30 ? 'text-amber-700 font-semibold' : ''}>{days > 0 ? `${days}d left` : 'Closed'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="dash-panel p-6 sticky top-4">
                <h2 className="font-bold text-ink-900 mb-1 line-clamp-2">{selected.opportunity.title}</h2>
                <p className="text-sm text-ink-500 mb-4">{selected.opportunity.hostOrg}</p>

                {/* Status selector */}
                <div className="mb-5">
                  <div className="text-xs font-semibold text-ink-600 mb-2">Application status</div>
                  <div className="flex flex-wrap gap-2">
                    {APPLICATION_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => updateStatus(selected.id, s.value)}
                        className={cn('text-xs px-3 py-1.5 rounded-full font-semibold transition-all', selected.status === s.value ? 'bg-brand-600 text-white' : 'bg-surface-50 ring-1 ring-surface-200 text-ink-600 hover:bg-surface-100')}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <div className="text-xs font-semibold text-ink-600 mb-2">
                    Document checklist ({selected.checklist.filter(c => c.completed).length}/{selected.checklist.length})
                  </div>
                  <div className="space-y-2">
                    {selected.checklist.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklist(selected.id, item.id, !item.completed)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-50 transition-colors text-left"
                      >
                        {item.completed
                          ? <CheckCircle2 className="h-4 w-4 text-brand-600 flex-shrink-0" />
                          : <Circle className="h-4 w-4 text-ink-200 flex-shrink-0" />
                        }
                        <span className={`text-sm ${item.completed ? 'line-through text-ink-400' : 'text-ink-700'}`}>{item.item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-surface-100 text-xs text-ink-400">
                  Deadline: {selected.opportunity.deadline ? formatDate(selected.opportunity.deadline) : 'No deadline'}
                </div>
              </div>
            ) : (
              <div className="dash-panel p-8 text-center text-ink-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select an application to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
