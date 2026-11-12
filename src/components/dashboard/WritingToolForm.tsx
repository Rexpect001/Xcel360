'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
  AlertTriangle, Check, Copy, Download, FileText, Info, Loader2, RefreshCw, RotateCcw, Sparkles, Target, Wand2, FilePlus2,
} from 'lucide-react'
import { WRITING_TOOLS, opportunityPrefill, type OpportunitySummary, type ToolId } from '@/lib/writing-tools'
import { checkOutput, countWords, fixableIssues, type DraftCheck } from '@/lib/writing-guardrails'
import Modal from '@/components/ui/Modal'
import CreditsNotice from '@/components/dashboard/CreditsNotice'
import { cn } from '@/lib/utils'

const FORM_KEY = (id: string) => `xcel360_tool_${id}`

export interface InitialDraft {
  id: string
  inputs: Record<string, string>
  output: string
  hasPrevious: boolean
  opportunityId: string | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function WritingToolForm({
  toolId,
  initialDraft = null,
  opportunity = null,
  credits: initialCredits = null,
}: {
  toolId: ToolId
  initialDraft?: InitialDraft | null
  opportunity?: OpportunitySummary | null
  /** Remaining credits; null means unlimited. */
  credits?: number | null
}) {
  const tool = WRITING_TOOLS[toolId]
  const startup = toolId.startsWith('startup-')
  const { data: session } = useSession()

  const [values, setValues] = useState<Record<string, string>>({})
  const [output, setOutput] = useState(initialDraft?.output ?? '')
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null)
  const [hasPrevious, setHasPrevious] = useState(initialDraft?.hasPrevious ?? false)
  // Client-side copy of the previous version, used if the draft could not be saved
  const [localPrevious, setLocalPrevious] = useState<string | null>(null)
  const [loading, setLoading] = useState<null | 'generate' | 'fix'>(null)
  const [saveState, setSaveState] = useState<SaveState>(initialDraft ? 'saved' : 'idle')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(initialCredits)
  const [outOfCredits, setOutOfCredits] = useState(false)

  // Text the model last returned. If the output differs, the user has edited it.
  const generatedRef = useRef<string | null>(initialDraft ? null : '')
  // Text last stored on the server, so autosave only sends real changes
  const savedRef = useRef<string>(initialDraft?.output ?? '')

  // ── Initial values: saved draft, or this tab's answers + listing + profile ──
  useEffect(() => {
    const defaults: Record<string, string> = {}
    for (const f of tool.fields) if (f.type === 'select' && f.options) defaults[f.id] = f.options[0]

    if (initialDraft) {
      setValues({ ...defaults, ...initialDraft.inputs })
      return
    }

    let saved: Record<string, string> = {}
    try { saved = JSON.parse(sessionStorage.getItem(FORM_KEY(toolId)) || '{}') } catch { /* ignore */ }
    const fromListing = opportunity ? opportunityPrefill(toolId, opportunity) : {}
    setValues({ ...defaults, ...saved, ...fromListing })

    if (!tool.fields.some((field) => field.prefill)) return
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!p) return
        const edu = [p.degree, p.courseOfStudy, p.school, p.graduationYear].filter(Boolean).join(', ')
        const pre: Record<string, string> = {
          level: p.level ?? '',
          course: edu,
          school: edu,
          countries: (p.targetCountries ?? []).join(', '),
        }
        setValues((v) => {
          const next = { ...v }
          for (const f of tool.fields) if (f.prefill && !next[f.id] && pre[f.prefill]) next[f.id] = pre[f.prefill]
          return next
        })
      })
      .catch(() => {})
  }, [toolId, tool.fields, initialDraft, opportunity])

  useEffect(() => {
    if (session?.user?.name) setValues((v) => (v.name ? v : { ...v, name: session.user.name ?? '' }))
  }, [session?.user?.name])

  const update = (id: string, value: string) => {
    setValues((v) => {
      const next = { ...v, [id]: value }
      if (!initialDraft) {
        try { sessionStorage.setItem(FORM_KEY(toolId), JSON.stringify(next)) } catch { /* ignore */ }
      }
      return next
    })
  }

  // ── Autosave edits to the saved draft ──
  const saveNow = useCallback(async (text: string) => {
    if (!draftId || text === savedRef.current) return
    setSaveState('saving')
    try {
      const res = await fetch(`/api/pro/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output: text }),
      })
      if (!res.ok) throw new Error()
      savedRef.current = text
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }, [draftId])

  useEffect(() => {
    if (!draftId || output === savedRef.current) return
    setSaveState('idle')
    const t = setTimeout(() => saveNow(output), 1200)
    return () => clearTimeout(t)
  }, [output, draftId, saveNow])

  // ── Live checks on whatever is in the editor ──
  const checks: DraftCheck[] = useMemo(() => {
    if (!output.trim()) return []
    const source = [
      ...Object.values(values),
      opportunity ? `${opportunity.title}\n${opportunity.org}\n${opportunity.eligibility}\n${opportunity.skills.join(', ')}` : '',
    ].join('\n')
    return checkOutput(toolId, output, source, { wordLimit: toolId === 'sop' ? Number(values.words) || undefined : undefined })
  }, [output, values, toolId, opportunity])
  const canFix = fixableIssues(checks).length > 0
  const words = useMemo(() => countWords(output), [output])

  // ── Generate / fix ──
  const run = async (action: 'generate' | 'fix') => {
    setLoading(action)
    try {
      await saveNow(output) // make sure the latest edits are stored before they become "previous"
      const res = await fetch('/api/pro/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: toolId,
          inputs: values,
          draftId,
          opportunityId: opportunity?.id,
          action,
          ...(action === 'fix' && { draft: output }),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402 || data.code === 'NO_CREDITS') {
        setCredits(0)
        setOutOfCredits(true)
        return
      }
      if (!res.ok) {
        toast.error(data.error ?? 'Could not generate a draft')
        return
      }
      if (typeof data.credits === 'number') setCredits(data.credits)
      if (output.trim()) setLocalPrevious(output)
      generatedRef.current = data.text
      savedRef.current = data.text
      setOutput(data.text)
      if (data.draftId) {
        setDraftId(data.draftId)
        setHasPrevious(!!data.hasPrevious)
        setSaveState('saved')
        if (!draftId) {
          const url = new URL(window.location.href)
          url.searchParams.set('draft', data.draftId)
          url.searchParams.delete('opportunity')
          window.history.replaceState(null, '', url.toString())
          try { sessionStorage.removeItem(FORM_KEY(toolId)) } catch { /* ignore */ }
        }
      } else {
        setSaveState('error')
        toast('Your draft is ready but could not be saved. Download or copy it before you leave.', { icon: '⚠️' })
      }
      if (action === 'fix') toast.success('Issues fixed. Your earlier version is kept.')
      if (data.truncated) toast('The draft hit the length limit and may be cut off at the end.', { icon: 'ℹ️' })
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (credits !== null && credits < 1) {
      setOutOfCredits(true)
      return
    }
    // Warn before replacing text the user has edited or reopened
    if (output.trim() && output !== generatedRef.current) {
      setConfirmOpen(true)
      return
    }
    run('generate')
  }

  const restorePrevious = async () => {
    if (draftId && hasPrevious) {
      try {
        const res = await fetch(`/api/pro/drafts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restorePrevious: true }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        savedRef.current = data.output
        generatedRef.current = data.output
        setOutput(data.output)
        toast.success('Previous version restored. Press again to switch back.')
      } catch {
        toast.error('Could not restore the previous version.')
      }
    } else if (localPrevious !== null) {
      const current = output
      setOutput(localPrevious)
      setLocalPrevious(current)
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
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const canRestore = (draftId && hasPrevious) || localPrevious !== null

  return (
    <div className="space-y-5">
      <CreditsNotice credits={credits} />
      {opportunity && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 flex items-start gap-3">
          <Target className="h-5 w-5 text-brand-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-700 flex-1">
            <p>
              Tailored to <Link href={`/opportunities/${opportunity.id}`} className="font-semibold text-brand-700 underline">{opportunity.title}</Link> ({opportunity.org}).
            </p>
            <p className="text-xs text-ink-500 mt-1">
              We filled in what this listing asks for. Its requirements are sent with your answers so the draft speaks to them. Your own experience still has to come from you.
            </p>
          </div>
          {!initialDraft && (
            <Link href={`/dashboard/tools/${toolId}`} className="text-xs font-semibold text-ink-500 hover:text-ink-900 whitespace-nowrap">Stop tailoring</Link>
          )}
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <form onSubmit={onSubmit} className="paper-card p-5 sm:p-6 space-y-4">
          {toolId === 'cv' && (
            <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-ink-700">
              Start with the programme or role you want. Your answers are sent to the AI service only when you generate a draft, and each draft is saved to <Link href="/dashboard/tools/drafts" className="font-semibold text-brand-700 underline">My drafts</Link>. <Link href="/resources" className="font-semibold text-brand-700 underline">See the public CV guides</Link>.
            </div>
          )}
          {tool.fields.map((f) => (
            <div key={f.id}>
              {f.section && <h2 className="pt-3 mb-3 border-t border-surface-200 font-bold text-ink-900">{f.section}</h2>}
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
                  required={f.required}
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
                  required={f.required}
                  onChange={(e) => update(f.id, e.target.value)}
                  className="input-field"
                />
              )}
              {f.help && <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{f.help}</p>}
            </div>
          ))}
          {toolId === 'cv' && (
            <div className="rounded-xl bg-surface-50 p-4 text-xs leading-relaxed text-ink-600">
              Before you submit: does each major bullet explain what you did, which skill or method you used, and the result? Are awards and conferences relevant to the target? Verify every date, grade, publication status, and referee detail yourself.
            </div>
          )}
          <button type="submit" disabled={!!loading} className="btn-primary w-full">
            {loading === 'generate'
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing your draft…</>
              : <><Sparkles className="h-4 w-4 text-accent-200" /> {output ? 'Generate a new version' : 'Generate draft'}</>}
          </button>
          {credits !== null && (
            <p className="-mt-2 text-center text-xs text-ink-500">Uses 1 credit · {credits} left</p>
          )}
          <p className="text-xs text-ink-400 leading-relaxed">
            {startup
              ? 'Treat this as a plan to test. The AI cannot verify demand or market facts for you. Save and edit your draft before making decisions.'
              : 'Drafts use only what you enter. Gaps are marked like [add GPA] so nothing is made up. Always edit the draft in your own voice before submitting.'}
          </p>
        </form>

        <section className="paper-card p-5 sm:p-6 xl:sticky xl:top-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-bold text-ink-900">{tool.outputLabel}</h2>
              {output && (
                <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1.5">
                  {words} words
                  {draftId && <span aria-hidden>·</span>}
                  {draftId && saveState === 'saving' && 'Saving…'}
                  {draftId && saveState === 'saved' && <><Check className="h-3 w-3 text-emerald-600" /> Saved</>}
                  {draftId && saveState === 'idle' && 'Unsaved changes'}
                  {saveState === 'error' && <span className="text-red-600">Not saved</span>}
                </p>
              )}
            </div>
            {output && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={copy} className="p-2 rounded-lg text-ink-500 hover:bg-surface-100 hover:text-ink-900" aria-label="Copy draft" title="Copy"><Copy className="h-4 w-4" /></button>
                <button type="button" onClick={() => download('doc')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 hover:bg-surface-100" aria-label="Download for Word"><Download className="h-3.5 w-3.5" /> Word</button>
                <button type="button" onClick={() => download('txt')} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 hover:bg-surface-100" aria-label="Download as text"><FileText className="h-3.5 w-3.5" /> .txt</button>
                {canRestore && (
                  <button type="button" onClick={restorePrevious} disabled={!!loading} className="p-2 rounded-lg text-ink-500 hover:bg-surface-100 hover:text-ink-900" aria-label="Restore previous version" title="Restore previous version"><RotateCcw className="h-4 w-4" /></button>
                )}
                <button type="button" onClick={() => onSubmit()} disabled={!!loading} className="p-2 rounded-lg text-ink-500 hover:bg-surface-100 hover:text-ink-900" aria-label="Generate a new version" title="Generate a new version"><RefreshCw className={cn('h-4 w-4', loading === 'generate' && 'animate-spin')} /></button>
              </div>
            )}
          </div>

          {output ? (
            <>
              <textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                aria-label={tool.outputLabel}
                className="w-full min-h-[480px] rounded-xl border border-surface-200 bg-surface-50 p-4 text-[14px] leading-relaxed text-ink-800 font-[inherit] focus:outline-none focus:ring-2 focus:ring-accent-300"
              />
              <DraftChecks checks={checks} canFix={canFix && !!draftId} fixing={loading === 'fix'} disabled={!!loading} onFix={() => run('fix')} />
              {draftId && (
                <div className="mt-3 flex justify-end">
                  <Link href={`/dashboard/tools/${toolId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900">
                    <FilePlus2 className="h-3.5 w-3.5" /> Start a separate draft
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="min-h-[320px] rounded-xl border border-dashed border-surface-300 bg-surface-50 flex flex-col items-center justify-center text-center p-8">
              {loading ? (
                <Loader2 className="h-6 w-6 text-ink-400 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-6 w-6 text-accent-500 mb-3" />
                  <p className="text-sm font-semibold text-ink-700">Your draft will appear here</p>
                  <p className="text-xs text-ink-400 mt-1 max-w-xs">Fill in the form and press Generate. Edits you make here are saved automatically.</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={outOfCredits}
        onClose={() => setOutOfCredits(false)}
        title="You're out of credits"
        description="Each new draft uses 1 credit. Buy a pack to keep going. Your answers and saved drafts stay here, and editing, fixing issues and restoring versions stay free."
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setOutOfCredits(false)} className="btn-light">Not now</button>
            <Link href="/dashboard/billing" className="btn-primary">See credit packs</Link>
          </>
        }
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Replace your current draft?"
        description={`A new version uses 1 credit and replaces the text in the editor, including your edits. Your current text is kept as the previous version, and you can bring it back with the restore button.`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} className="btn-light">Keep editing</button>
            <button type="button" onClick={() => { setConfirmOpen(false); run('generate') }} className="btn-primary">Generate new version</button>
          </>
        }
      />
    </div>
  )
}

function DraftChecks({
  checks, canFix, fixing, disabled, onFix,
}: { checks: DraftCheck[]; canFix: boolean; fixing: boolean; disabled: boolean; onFix: () => void }) {
  if (!checks.length) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
        <Check className="h-3.5 w-3.5" /> Passed our checks for made-up facts, clichés and length. Still read it carefully.
      </p>
    )
  }
  return (
    <div className="mt-3 rounded-xl border border-surface-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-ink-900">Draft check</h3>
        {canFix && (
          <button type="button" onClick={onFix} disabled={disabled} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-60">
            {fixing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Fix these issues
          </button>
        )}
      </div>
      <ul className="space-y-2.5">
        {checks.map((c) => (
          <li key={c.code} className="flex gap-2 text-xs leading-relaxed">
            {c.level === 'warn'
              ? <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              : <Info className="h-4 w-4 text-brand-600 flex-shrink-0" />}
            <div>
              <p className="text-ink-700">{c.message}</p>
              {c.items && c.items.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.items.map((i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-surface-100 text-ink-600 font-mono text-[11px]">{i}</span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
