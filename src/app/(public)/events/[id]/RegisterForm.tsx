'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, Loader2, User, Mail, Phone, MessageCircle, ChevronRight, CalendarCheck, Copy, Share2, Check } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  label: string
  type: string
  options: string[]
  required: boolean
}

interface Props {
  eventId: string
  eventTitle: string
  questions: Question[]
}

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition bg-gray-50 focus:bg-white'

export default function RegisterForm({ eventId, eventTitle, questions }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  const setAnswer = (qId: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [qId]: value }))

  const handleSameAsPhone = (checked: boolean) => {
    setSameAsPhone(checked)
    if (checked) setWhatsappPhone(phone)
  }

  const handlePhoneChange = (val: string) => {
    setPhone(val)
    if (sameAsPhone) setWhatsappPhone(val)
  }

  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${eventId}`
    : `/events/${eventId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: eventTitle,
        text: `Join me at "${eventTitle}" — register here:`,
        url: eventUrl,
      }).catch(() => {})
    } else {
      handleCopyLink()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please fill in your name and email')
      return
    }
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    if (!whatsappPhone.trim()) {
      toast.error('WhatsApp number is required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, whatsappPhone, answers }),
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
      <div className="text-center py-8 px-4">
        {/* Success animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re in!</h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-2">
          Your spot for <span className="font-semibold text-gray-700">{eventTitle}</span> is confirmed.
        </p>
        <p className="text-sm text-gray-400 mb-8">Check your inbox — we&apos;ll send all the details you need.</p>

        {/* Share invite section */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="h-4 w-4 text-brand-700" />
            <p className="text-sm font-bold text-brand-800">Invite your friends!</p>
          </div>
          <p className="text-xs text-brand-600 mb-4 leading-relaxed">
            Know someone who&apos;d benefit? Share this event and help 5 more people register.
          </p>
          <div className="flex items-center gap-2 bg-white border border-brand-200 rounded-xl px-3 py-2 mb-3">
            <span className="text-xs text-gray-500 flex-1 truncate">{eventUrl}</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors shrink-0"
            >
              {copied ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
          </div>
          <button
            onClick={handleShare}
            className="w-full py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" /> Share with friends
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            <CalendarCheck className="h-4 w-4" /> Join WhatsApp for updates
          </a>
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Browse more events
          </Link>
        </div>
      </div>
    )
  }

  const totalFields = 4 + questions.length
  const filled = [fullName, email, phone, whatsappPhone].filter(Boolean).length +
    Object.values(answers).filter(Boolean).length
  const progress = Math.round((filled / totalFields) * 100)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Form completion</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-sky-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Fixed fields */}
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Full Name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Jane Doe"
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Email Address <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@example.com"
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Active Phone Number <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            required
            placeholder="+234 800 000 0000"
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            WhatsApp Number <span className="text-red-400">*</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sameAsPhone}
              onChange={(e) => handleSameAsPhone(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-brand-600 border-gray-300"
            />
            <span className="text-xs text-gray-500">Same as phone</span>
          </label>
        </div>
        <div className="relative">
          <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
          <input
            type="tel"
            value={whatsappPhone}
            onChange={(e) => { setSameAsPhone(false); setWhatsappPhone(e.target.value) }}
            required
            placeholder="+234 800 000 0000"
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      {/* Custom questions */}
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            {q.label}{' '}
            {q.required ? (
              <span className="text-red-400">*</span>
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
        className="w-full py-4 bg-gradient-to-r from-brand-700 to-brand-600 text-white rounded-xl font-bold text-sm hover:from-brand-800 hover:to-brand-700 disabled:opacity-60 transition-all shadow-sm shadow-brand-200 flex items-center justify-center gap-2 mt-2"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          <>Register for this Event <ChevronRight className="h-4 w-4" /></>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        A confirmation will be sent to your email. Your information is only shared with the Xcel360 team.
      </p>
    </form>
  )
}
