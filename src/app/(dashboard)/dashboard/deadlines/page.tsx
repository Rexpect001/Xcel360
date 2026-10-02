'use client'
import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { ApplicationWithOpportunity } from '@/types'
import { formatDate, daysUntilDeadline } from '@/lib/utils'
import Link from 'next/link'

export default function DeadlinesPage() {
  const [apps, setApps] = useState<ApplicationWithOpportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/applications')
      .then((r) => r.json())
      .then((data) => { setApps(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const upcoming = apps
    .filter((a) => daysUntilDeadline(a.opportunity.deadline) > 0)
    .sort((a, b) => new Date(a.opportunity.deadline ?? 0).getTime() - new Date(b.opportunity.deadline ?? 0).getTime())

  const past = apps.filter((a) => daysUntilDeadline(a.opportunity.deadline) <= 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink-900">Deadline Tracker</h1>
        <p className="text-gray-500 mt-1">{upcoming.length} upcoming deadline{upcoming.length !== 1 ? 's' : ''}</p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No deadlines to track. Start by saving and tracking scholarships.</p>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.map((app, i) => {
            const days = daysUntilDeadline(app.opportunity.deadline)
            const isUrgent = days <= 7
            const isModerate = days <= 30

            return (
              <div key={app.id} className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isUrgent ? 'bg-red-100' : isModerate ? 'bg-orange-100' : 'bg-green-100'
                    }`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className={`h-5 w-5 ${isModerate ? 'text-orange-600' : 'text-green-600'}`} />
                    )}
                  </div>
                  {i < upcoming.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 my-1 min-h-4" />}
                </div>

                {/* Card */}
                <div
                  className={`flex-1 bg-white rounded-2xl border p-5 mb-2 ${
                    isUrgent ? 'border-red-200' : isModerate ? 'border-orange-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 leading-snug">{app.opportunity.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{app.opportunity.hostOrg}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`text-2xl font-bold ${
                          isUrgent ? 'text-red-600' : isModerate ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        {days}
                      </div>
                      <div
                        className={`text-xs ${
                          isUrgent ? 'text-red-500' : isModerate ? 'text-orange-500' : 'text-green-500'
                        }`}
                      >
                        days left
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(app.opportunity.deadline)}
                    </span>
                    <span>{app.checklist.filter((c) => c.completed).length}/{app.checklist.length} docs ready</span>
                  </div>

                  {isUrgent && (
                    <div className="mt-3 px-3 py-2 bg-red-50 rounded-lg text-xs text-red-700 font-medium">
                      ⚠️ Deadline in {days} days  -  make sure everything is ready!
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {past.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Past Deadlines</h2>
              {past.map((app) => (
                <div key={app.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5 mb-2 opacity-60">
                    <h3 className="font-medium text-gray-700">{app.opportunity.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Deadline: {formatDate(app.opportunity.deadline)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
