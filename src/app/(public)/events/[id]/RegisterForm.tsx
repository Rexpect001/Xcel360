'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface Question {
  id: string
  label: string
  type: string        // "text" | "textarea" | "select"
  options: string[]
  required: boolean
}

interface Props {
  eventId: string
  eventTitle: string
  questions: Question[]
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition'

export default function RegisterForm({ eventId, eventTitle, questions }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const setAnswer = (qId: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [qId]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please fill in your name and email')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, answers }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
      } else {
        toast.error(data.error || 'Registration failed. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re registered!</h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Your spot for{' '}
          <span className="font-medium text-gray-700">{eventTitle}</span> is confirmed.
          Check your inbox — we&apos;ll send you all the details you need.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      {/* Fixed fields */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Jane Doe"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="jane@example.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Phone Number{' '}
          <span className="text-gray-400 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+234 800 000 0000"
          className={inputCls}
        />
      </div>

      {/* Custom questions */}
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            {q.label}{' '}
            {q.required ? (
              <span className="text-red-500">*</span>
            ) : (
              <span className="text-gray-400 font-normal normal-case">(optional)</span>
            )}
          </label>

          {q.type === 'textarea' ? (
            <textarea
              rows={3}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              required={q.required}
              className={`${inputCls} resize-none`}
            />
          ) : q.type === 'select' ? (
            <select
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              required={q.required}
              className={inputCls}
            >
              <option value="">— Select an option —</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              required={q.required}
              className={inputCls}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          'Register for this Event'
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        A confirmation will be sent to your email. Your information is only shared with the Xcel360 team.
      </p>
    </form>
  )
}
