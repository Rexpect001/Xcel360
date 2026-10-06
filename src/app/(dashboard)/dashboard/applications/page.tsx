'use client'
import { useState, useEffect } from 'react'
import { FileText, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { ApplicationWithOpportunity, APPLICATION_STATUSES } from '@/types'
import { formatDate, daysUntilDeadline } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

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
        <p className="text-gray-500 mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''} tracked</p>
      </div>

      {/* Pipeline view */}
      <div className="grid grid-cols-5 gap-3 mb-8 overflow-x-auto pb-2">
        {APPLICATION_STATUSES.map((status) => {
          const count = apps.filter((a) => a.status === status.value).length
          return (
            <div key={status.value} className="bg-white rounded-xl border border-gray-100 p-3 min-w-28">
              <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mb-2 ${status.color}`}>{status.label}</div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
            </div>
          )
        })}
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No applications tracked yet. Save an opportunity and start tracking.</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700">
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
                  className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md ${selected?.id === app.id ? 'border-brand-300 shadow-md ring-1 ring-brand-200' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{app.opportunity.title}</h3>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{app.opportunity.hostOrg}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status?.color ?? 'bg-gray-100 text-gray-700'}`}>{status?.label}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{completedItems}/{app.checklist.length} docs</span>
                      <span className={days <= 30 ? 'text-orange-500 font-medium' : ''}>{days > 0 ? `${days}d left` : 'Closed'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-4">
                <h2 className="font-bold text-gray-900 mb-1 line-clamp-2">{selected.opportunity.title}</h2>
                <p className="text-sm text-gray-500 mb-4">{selected.opportunity.hostOrg}</p>

                {/* Status selector */}
                <div className="mb-5">
                  <div className="text-xs font-medium text-gray-600 mb-2">Application Status</div>
                  <div className="flex flex-wrap gap-2">
                    {APPLICATION_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => updateStatus(selected.id, s.value)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selected.status === s.value ? s.color + ' ring-2 ring-offset-1 ring-brand-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Document Checklist ({selected.checklist.filter(c => c.completed).length}/{selected.checklist.length})
                  </div>
                  <div className="space-y-2">
                    {selected.checklist.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklist(selected.id, item.id, !item.completed)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        {item.completed
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          : <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        }
                        <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
                  Deadline: {selected.opportunity.deadline ? formatDate(selected.opportunity.deadline) : 'No deadline'}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
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
