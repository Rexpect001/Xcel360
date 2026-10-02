'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Download, Users, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface Answer {
  questionId: string
  answer: string
  question: { label: string; sortOrder: number }
}

interface Registration {
  id: string
  fullName: string
  email: string
  phone: string | null
  createdAt: string
  answers: Answer[]
}

interface Question {
  id: string
  label: string
  sortOrder: number
}

interface EventInfo {
  id: string
  title: string
  date: string
  type: string
}

export default function AdminEventRegistrationsPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/events/${id}/registrations`)
      .then((r) => r.json())
      .then((d) => {
        if (d.event) setEvent(d.event)
        if (Array.isArray(d.registrations)) setRegistrations(d.registrations)
        if (Array.isArray(d.questions)) setQuestions(d.questions)
        setLoading(false)
      })
  }, [id])

  const downloadCSV = () => window.open(`/api/admin/events/${id}/registrations?format=csv`, '_blank')

  const eventDate = event
    ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/events"
          className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-3xl text-ink-900">Registrations</h1>
          {event && (
            <p className="text-gray-500 mt-0.5 text-sm">
              {event.title} &middot; {eventDate}
            </p>
          )}
        </div>
        {registrations.length > 0 && (
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-ink-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink-800 transition-colors"
          >
            <Download className="h-4 w-4" /> Download CSV
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No registrations yet for this event.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-500 font-medium">
            {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
          </div>

          <div className="space-y-3">
            {registrations.map((reg) => {
              const answerMap: Record<string, string> = {}
              for (const a of reg.answers) answerMap[a.questionId] = a.answer
              const isOpen = expanded === reg.id

              return (
                <div key={reg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Header row */}
                  <button
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpanded(isOpen ? null : reg.id)}
                  >
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-brand-700 font-bold text-sm">
                        {reg.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{reg.fullName}</p>
                      <p className="text-sm text-gray-500 truncate">{reg.email}</p>
                    </div>
                    <div className="hidden sm:block text-xs text-gray-400 shrink-0">
                      {new Date(reg.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                    {reg.phone && (
                      <span className="hidden md:block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                        {reg.phone}
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded answers */}
                  {isOpen && (
                    <div className="border-t border-gray-50 px-6 py-4 bg-gray-50">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
                          <a href={`mailto:${reg.email}`} className="text-sm text-brand-700 hover:underline">
                            {reg.email}
                          </a>
                        </div>
                        {reg.phone && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                            <p className="text-sm text-gray-700">{reg.phone}</p>
                          </div>
                        )}
                        {questions.map((q) => (
                          answerMap[q.id] ? (
                            <div key={q.id} className={q.label.length > 40 ? 'sm:col-span-2' : ''}>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                {q.label}
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">{answerMap[q.id]}</p>
                            </div>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
