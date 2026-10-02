'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { CheckCircle2, Clock, Mail, ShieldCheck, Loader2 } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'

const TOPICS = ['Strategy call', 'Application review', 'Interview preparation', 'Choosing a programme', 'Visa and pre-departure', 'Something else']
const STAGES = ['Just starting to look', 'Shortlisting scholarships', 'Writing my application', 'Waiting for results', 'Preparing for interview']

function AdvisorForm() {
  const params = useSearchParams()
  const { data: session } = useSession()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: TOPICS.includes(params.get('topic') ?? '') ? (params.get('topic') as string) : TOPICS[0],
    stage: STAGES[0],
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({ ...f, name: f.name || session.user.name || '', email: f.email || session.user.email || '' }))
    }
  }, [session?.user])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'advisor', ...form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Could not send your request')
        return
      }
      setSent(true)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="paper-card p-10 text-center max-w-xl">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-ink-900">Request received</h2>
        <p className="text-ink-500 mt-2">An advisor will reply to {form.email} within 2 working days with next steps and available times.</p>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
      <form onSubmit={submit} className="paper-card p-5 sm:p-7 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" required value={form.name} onChange={set('name')} className="input-field" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required value={form.email} onChange={set('email')} className="input-field" />
          </div>
          <div>
            <label htmlFor="topic" className="label">What do you need help with?</label>
            <select id="topic" value={form.topic} onChange={set('topic')} className="input-field">
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="stage" className="label">Where are you now?</label>
            <select id="stage" value={form.stage} onChange={set('stage')} className="input-field">
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="phone" className="label">WhatsApp number (optional)</label>
          <input id="phone" value={form.phone} onChange={set('phone')} placeholder="+234…" className="input-field" />
        </div>
        <div>
          <label htmlFor="message" className="label">Tell us a bit more</label>
          <textarea
            id="message"
            required
            minLength={10}
            rows={6}
            value={form.message}
            onChange={set('message')}
            placeholder="Which scholarships you are targeting, your deadline, and what you would like from the session."
            className="input-field resize-y"
          />
        </div>
        <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto">
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : 'Send request'}
        </button>
      </form>

      <aside className="space-y-3">
        {[
          { icon: Clock, title: 'Reply within 2 working days', text: 'With available times and what to prepare.' },
          { icon: Mail, title: 'Everything by email', text: 'We confirm details in writing before any session.' },
          { icon: ShieldCheck, title: 'Your documents stay private', text: 'Only your advisor sees what you share.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="paper-card p-4 flex gap-3">
            <Icon className="h-5 w-5 text-accent-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink-900">{title}</p>
              <p className="text-xs text-ink-500 mt-0.5">{text}</p>
            </div>
          </div>
        ))}
      </aside>
    </div>
  )
}

export default function AdvisorPage() {
  return (
    <div>
      <DashHeader
        eyebrow="Services"
        title="Speak with an advisor"
        subtitle="Tell us where you are and what you need. A real person from the Xcel360 team will get back to you."
      />
      <Suspense fallback={null}>
        <AdvisorForm />
      </Suspense>
    </div>
  )
}
