'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Bell, FlaskConical, Loader2, Send } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

const TITLE_MAX = 80
const MESSAGE_MAX = 500

type Audience = 'all' | 'level'

export default function BroadcastForm({ levels }: { levels: { level: string; count: number }[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
  const [level, setLevel] = useState(levels[0]?.level ?? '')
  const [busy, setBusy] = useState<null | 'test' | 'count' | 'send'>(null)
  const [confirm, setConfirm] = useState<number | null>(null)

  const linkOk = !link.trim() || /^\/(?!\/)/.test(link.trim()) || /^https:\/\//i.test(link.trim())
  const ready = title.trim() && message.trim() && linkOk && (audience === 'all' || level)
  const payload = () => ({ title: title.trim(), message: message.trim(), link: link.trim(), audience, level })

  const send = async (mode: 'test' | 'real') => {
    setBusy(mode === 'test' ? 'test' : 'send')
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'test' ? { ...payload(), audience: 'test' } : payload()),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not send')
      if (mode === 'test') {
        toast.success('Test sent to your own Notifications. Open your dashboard to see it.')
      } else {
        toast.success(`Sent to ${data.sent.toLocaleString()} ${data.sent === 1 ? 'person' : 'people'}`)
        setConfirm(null)
        setTitle(''); setMessage(''); setLink('')
        router.refresh()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setBusy(null)
    }
  }

  const askToSend = async () => {
    setBusy('count')
    try {
      const res = await fetch(`/api/admin/broadcast?audience=${audience}&level=${encodeURIComponent(level)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not count recipients')
      setConfirm(data.recipients)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not count recipients')
    } finally {
      setBusy(null)
    }
  }

  const audienceLabel = audience === 'all' ? 'everyone' : `${level} students`

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] items-start">
      <form
        onSubmit={(e) => { e.preventDefault(); if (ready) askToSend() }}
        className="paper-card p-5 sm:p-6 space-y-4"
      >
        <div>
          <label htmlFor="n-title" className="label">Title <span className="text-red-500">*</span></label>
          <input id="n-title" className="input-field" value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="New: fully funded master's in Europe" required />
          <p className="mt-1 text-xs text-ink-400 text-right tabular-nums">{title.length}/{TITLE_MAX}</p>
        </div>
        <div>
          <label htmlFor="n-message" className="label">Message <span className="text-red-500">*</span></label>
          <textarea id="n-message" rows={4} className="input-field resize-y" value={message} maxLength={MESSAGE_MAX} onChange={(e) => setMessage(e.target.value)} placeholder="65 joint master's programmes are open now, most fully funded. Applications close from December." required />
          <p className="mt-1 text-xs text-ink-400 text-right tabular-nums">{message.length}/{MESSAGE_MAX}</p>
        </div>
        <div>
          <label htmlFor="n-link" className="label">Link (optional)</label>
          <input id="n-link" className={cn('input-field', !linkOk && 'ring-2 ring-red-300')} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/scholarships/scholarships-in-europe" />
          <p className={cn('mt-1 text-xs', linkOk ? 'text-ink-400' : 'text-red-600')}>
            {linkOk ? 'A page on Xcel360 (starting with /) or a full https:// link.' : 'Start with / for a page on Xcel360, or https:// for another site.'}
          </p>
        </div>

        <fieldset>
          <legend className="label">Send to</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-100 p-1">
            {(['all', 'level'] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={audience === a}
                onClick={() => setAudience(a)}
                disabled={a === 'level' && levels.length === 0}
                className={cn('rounded-lg px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-40', audience === a ? 'bg-white text-brand-700 shadow-soft ring-1 ring-brand-200' : 'text-ink-700 hover:text-ink-900')}
              >
                {a === 'all' ? 'Everyone' : 'One study level'}
              </button>
            ))}
          </div>
          {audience === 'level' && (
            <select aria-label="Study level" className="input-field mt-2" value={level} onChange={(e) => setLevel(e.target.value)}>
              {levels.map((l) => <option key={l.level} value={l.level}>{l.level} ({l.count.toLocaleString()} with notifications on)</option>)}
            </select>
          )}
        </fieldset>

        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => send('test')} disabled={!ready || !!busy} className="btn-light inline-flex items-center gap-2">
            {busy === 'test' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Send test to me
          </button>
          <button type="submit" disabled={!ready || !!busy} className="btn-primary inline-flex items-center gap-2">
            {busy === 'count' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send to {audienceLabel}…
          </button>
        </div>
      </form>

      {/* Preview */}
      <aside aria-label="Preview" className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-400">What users will see</p>
        <div className="rounded-2xl border border-accent-200 bg-accent-50 p-4 flex gap-3">
          <span className="h-9 w-9 shrink-0 rounded-xl bg-white flex items-center justify-center ring-1 ring-accent-200"><Bell className="h-4 w-4 text-accent-700" /></span>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 break-words">{title || 'Your title'}</p>
            <p className="mt-0.5 text-sm text-ink-700 whitespace-pre-line break-words">{message || 'Your message appears here.'}</p>
            {link && linkOk && <p className="mt-2 text-sm font-semibold text-brand-700">Open →</p>}
          </div>
        </div>
        <p className="text-xs text-ink-500 leading-relaxed">
          This card appears on their dashboard home. They also get a pop-up the next time they use the dashboard, and a red count on Notifications in the menu until they read it.
        </p>
      </aside>

      <Modal
        open={confirm !== null}
        onClose={() => busy !== 'send' && setConfirm(null)}
        title={`Send to ${confirm?.toLocaleString() ?? 0} ${confirm === 1 ? 'person' : 'people'}?`}
        description={confirm === 0
          ? 'Nobody matches this audience right now.'
          : `"${title.trim()}" will go to ${audienceLabel}'s Notifications straight away. This can't be unsent, so check it with "Send test to me" first.`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setConfirm(null)} disabled={busy === 'send'} className="btn-light">Cancel</button>
            <button type="button" onClick={() => send('real')} disabled={busy === 'send' || confirm === 0} className="btn-primary inline-flex items-center gap-2">
              {busy === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send now
            </button>
          </>
        }
      />
    </div>
  )
}
