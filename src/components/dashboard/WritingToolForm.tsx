'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { Copy, Download, Loader2, RefreshCw, Sparkles, FileText } from 'lucide-react'
import { WRITING_TOOLS, type ToolId } from '@/lib/writing-tools'
import { cn } from '@/lib/utils'

const DRAFT_KEY = (id: string) => `xcel360_tool_${id}`

export default function WritingToolForm({ toolId }: { toolId: ToolId }) {
  const tool = WRITING_TOOLS[toolId]
  const { data: session } = useSession()
  const [values, setValues] = useState<Record<string, string>>({})
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  // Restore an unfinished draft, then prefill blanks from the profile
  useEffect(() => {
    let saved: Record<string, string> = {}
    try { saved = JSON.parse(localStorage.getItem(DRAFT_KEY(toolId)) || '{}') } catch { /* ignore */ }
    const defaults: Record<string, string> = {}
    for (const f of tool.fields) if (f.type === 'select' && f.options) defaults[f.id] = f.options[0]
    setValues({ ...defaults, ...saved })

    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p) return
        const pre: Record<string, string> = {
          level: p.level ?? '',
          course: [p.degree, p.courseOfStudy, p.school, p.graduationYear].filter(Boolean).join(', '),
          school: [p.degree, p.courseOfStudy, p.school, p.graduationYear].filter(Boolean).join(', '),
          countries: (p.targetCountries ?? []).join(', '),
        }
        setValues((v) => {
          const next = { ...v }
          for (const f of tool.fields) if (f.prefill && !next[f.id] && pre[f.prefill]) next[f.id] = pre[f.prefill]
          return next
        })
      })
      .catch(() => {})
  }, [toolId, tool.fields])

  useEffect(() => {
    if (session?.user?.name) {
      setValues((v) => (v.name ? v : { ...v, name: session.user.name ?? '' }))
    }
  }, [session?.user?.name])

  const update = (id: string, value: string) => {
    setValues((v) => {
      const next = { ...v, [id]: value }
      try { localStorage.setItem(DRAFT_KEY(toolId), JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const generate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/pro/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolId, inputs: values }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Could not generate a draft')
        return
      }
      setOutput(data.text)
      if (data.truncated) toast('The draft hit the length limit. Try a shorter word count.', { icon: 'ℹ️' })
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      toast.success('Copied')
    } catch {
      toast.error('Copy failed. Select the text and copy manually.')
    }
  }

  const download = (kind: 'txt' | 'doc') => {
    const base = `${tool.name.replace(/\s+/g, '-').toLowerCase()}-draft`
    const blob =
      kind === 'txt'
        ? new Blob([output], { type: 'text/plain;charset=utf-8' })
        : new Blob(
            [`<html><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial;font-size:11pt;line-height:1.5">${output
              .split('\n')
              .map((l) => (l.trim() ? `<p style="margin:0 0 6pt">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>` : '<br/>'))
              .join('')}</body></html>`],
            { type: 'application/msword' }
          )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}.${kind}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid xl:grid-cols-2 gap-6 items-start">
      <form onSubmit={generate} className="paper-card p-5 sm:p-6 space-y-4">
        {tool.fields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="label">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                id={f.id}
                rows={4}
                value={values[f.id] ?? ''}
                maxLength={f.max}
                placeholder={f.placeholder}
                onChange={(e) => update(f.id, e.target.value)}
                className="input-field resize-y"
              />
            ) : f.type === 'select' ? (
              <select id={f.id} value={values[f.id] ?? ''} onChange={(e) => update(f.id, e.target.value)} className="input-field">
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                id={f.id}
                type="text"
                value={values[f.id] ?? ''}
                maxLength={f.max}
                placeholder={f.placeholder}
                onChange={(e) => update(f.id, e.target.value)}
                className="input-field"
              />
            )}
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing your draft…</> : <><Sparkles className="h-4 w-4 text-accent-300" /> Generate draft</>}
        </button>
        <p className="text-xs text-ink-400 leading-relaxed">
          Drafts use only what you enter. Gaps are marked like [add GPA] so nothing is made up. Always edit the draft in your own voice before submitting.
        </p>
      </form>

      <section className="paper-card p-5 sm:p-6 xl:sticky xl:top-6" aria-live="polite">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-ink-900">{tool.outputLabel}</h2>
          {output && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={copy} className="p-2 rounded-lg text-ink-500 hover:bg-surface-100 hover:text-ink-900" aria-label="Copy draft"><Copy className="h-4 w-4" /></button>
              <button type="button" onClick={() => download('doc')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 hover:bg-surface-100" aria-label="Download for Word"><Download className="h-3.5 w-3.5" /> Word</button>
              <button type="button" onClick={() => download('txt')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 hover:bg-surface-100" aria-label="Download as text"><FileText className="h-3.5 w-3.5" /> .txt</button>
              <button type="button" onClick={() => generate()} disabled={loading} className="p-2 rounded-lg text-ink-500 hover:bg-surface-100 hover:text-ink-900" aria-label="Regenerate"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></button>
            </div>
          )}
        </div>
        {output ? (
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            className="w-full min-h-[520px] rounded-xl border border-surface-200 bg-surface-50 p-4 text-[14px] leading-relaxed text-ink-800 font-[inherit] focus:outline-none focus:ring-2 focus:ring-accent-300"
          />
        ) : (
          <div className="min-h-[320px] rounded-xl border border-dashed border-surface-300 bg-surface-50 flex flex-col items-center justify-center text-center p-8">
            {loading ? (
              <Loader2 className="h-6 w-6 text-ink-400 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-6 w-6 text-accent-500 mb-3" />
                <p className="text-sm font-semibold text-ink-700">Your draft will appear here</p>
                <p className="text-xs text-ink-400 mt-1 max-w-xs">Fill in the form and press Generate. You can edit the draft right here before downloading.</p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
