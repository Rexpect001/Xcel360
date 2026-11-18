'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Lock, Sparkles, X, Send, RotateCcw, ImageIcon, FileText, CheckCircle2,
  Loader2, ExternalLink, GraduationCap, Briefcase, Building2, LogOut,
  AlertTriangle, Eye, Pencil, MapPin, CalendarDays, Copy, Info,
} from 'lucide-react'
import RichDescription from '@/components/opportunities/RichDescription'

type PostType = 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP'

interface Duplicate { id: string; title: string; hostOrg: string; createdAt: string; status: string }

interface Extracted {
  postType: PostType
  title: string; hostOrg: string; country: string
  fundingType: string; field: string; programLevel: string[]
  deadline: string | null; eligibility: string; description: string
  applicationLink: string; requiredDocs: string[]; fieldTags: string[]
  company: string; jobType: string; salary: string
  remote: boolean; experienceLevel: string; skills: string[]
  duplicates?: Duplicate[]
}

type Stats = {
  poster: string; thisMonth: number; allTime: number
  recent?: { opportunityId: string; title: string; category: string; createdAt: string }[]
}

const POST_TYPES: { type: PostType; label: string; sub: string; icon: React.ReactNode; tone: string; chip: string }[] = [
  { type: 'SCHOLARSHIP', label: 'Scholarship', sub: 'Funding, grants, fellowships & academic awards', icon: <GraduationCap size={26} />, tone: 'bg-brand-600', chip: 'bg-brand-50 text-brand-700' },
  { type: 'JOB',         label: 'Job',         sub: 'Full-time, part-time & contract positions',      icon: <Briefcase size={26} />,     tone: 'bg-success-600', chip: 'bg-success-50 text-success-700' },
  { type: 'INTERNSHIP',  label: 'Internship',  sub: 'Paid & unpaid internship programmes',            icon: <Building2 size={26} />,     tone: 'bg-warning-600', chip: 'bg-warning-50 text-warning-700' },
]

const FUNDING_TYPES = ['Fully funded', 'Partial', 'Tuition only', 'Stipend only', 'Other']
const FIELDS = ['STEM', 'Non-STEM', 'Arts', 'Business', 'Law', 'Medicine', 'Social Sciences', 'Humanities', 'General']
const LEVELS = ['Undergraduate', 'Masters', 'PhD', 'Postdoctoral', 'Professional', 'Any']
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Volunteer']
const INTERNSHIP_TYPES = ['Full-time', 'Part-time', 'Paid', 'Unpaid', 'Hybrid']
const EXP_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Internship']
const DOC_SUGGESTIONS = ['CV', 'Cover Letter', 'Statement of Purpose', 'Transcripts', 'Reference Letters', 'Passport', 'English Test Results', 'Research Proposal', 'Portfolio']
const MONTHLY_GOAL = 30
const PW_KEY = 'xcel-poster-pw'
const STEPS = ['Type', 'Source', 'Review', 'Published']

const input = 'w-full bg-white border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
const label = 'block text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1.5'
const card = 'bg-white border border-surface-200 rounded-2xl'

const isHttpUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }
const isEmail = (s: string) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(s)

function compressImage(file: File): Promise<{ data: string; mediaType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1400
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ data: dataUrl.split(',')[1], mediaType: 'image/jpeg', preview: dataUrl })
    }
    img.onerror = reject
    img.src = url
  })
}

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }))
  return { res, data }
}

function fmtDate(d: string | null | undefined) {
  if (!d) return ''
  const date = new Date(d)
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── Small pieces ─────────────────────────────────────────────────────────── */

function StepBar({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3 text-xs mb-8 overflow-x-auto">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
            i < step ? 'bg-success-600 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-surface-200 text-ink-400'}`}>
            {i < step ? <CheckCircle2 size={14} /> : i + 1}
          </span>
          <span className={i === step ? 'font-semibold text-ink-900' : 'text-ink-400'}>{s}</span>
          {i < STEPS.length - 1 && <span className="w-6 sm:w-10 h-px bg-surface-300" />}
        </li>
      ))}
    </ol>
  )
}

function ChipInput({ value, onChange, placeholder, suggestions }: {
  value: string[]; onChange: (v: string[]) => void; placeholder: string; suggestions?: string[]
}) {
  const [draft, setDraft] = useState('')
  const add = (raw: string) => {
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean)
    const next = [...value]
    for (const it of items) if (!next.some((x) => x.toLowerCase() === it.toLowerCase())) next.push(it)
    onChange(next); setDraft('')
  }
  const unused = (suggestions ?? []).filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
  return (
    <div>
      <div className={`${input} flex flex-wrap gap-1.5 items-center min-h-[44px]`}>
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 rounded-lg pl-2.5 pr-1 py-1 text-xs font-medium">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}
              className="w-4 h-4 rounded hover:bg-brand-100 flex items-center justify-center"><X size={10} /></button>
          </span>
        ))}
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); add(draft) }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? '' : placeholder}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder-ink-300" />
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {unused.slice(0, 8).map((s) => (
            <button key={s} type="button" onClick={() => add(s)}
              className="text-xs px-2 py-1 rounded-lg border border-dashed border-surface-300 text-ink-400 hover:border-brand-400 hover:text-brand-600">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Preview({ e, typeLabel, chip }: { e: Extracted; typeLabel: string; chip: string }) {
  const org = e.postType === 'SCHOLARSHIP' ? e.hostOrg : (e.company || e.hostOrg)
  const facts = [
    e.postType === 'SCHOLARSHIP' ? e.fundingType : e.jobType,
    e.postType !== 'SCHOLARSHIP' && e.salary ? e.salary : '',
    e.postType === 'JOB' ? e.experienceLevel : '',
    e.remote && e.postType !== 'SCHOLARSHIP' ? 'Remote / hybrid' : '',
    ...(e.postType !== 'JOB' ? e.programLevel ?? [] : []),
  ].filter(Boolean)
  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5 ${chip}`}>{typeLabel}</span>
        <h3 className="font-display font-bold text-xl text-ink-900 mt-2 leading-snug">{e.title || 'Untitled listing'}</h3>
        <p className="text-sm text-ink-500 mt-1">{org || 'Organisation'}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-ink-500">
          <span className="flex items-center gap-1"><MapPin size={12} /> {e.country || 'Global'}</span>
          <span className="flex items-center gap-1"><CalendarDays size={12} /> {e.deadline ? fmtDate(e.deadline) : 'Rolling / not stated'}</span>
        </div>
        {facts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {facts.map((f) => <span key={f} className="text-xs bg-surface-100 text-ink-600 rounded-md px-2 py-1">{f}</span>)}
          </div>
        )}
      </div>
      {e.description?.trim() && (
        <div className={`${card} p-5`}>
          <p className="font-display font-semibold text-ink-900 mb-2">About this {e.postType === 'JOB' ? 'role' : e.postType === 'INTERNSHIP' ? 'internship' : 'scholarship'}</p>
          <RichDescription text={e.description} compact />
        </div>
      )}
      {e.eligibility?.trim() && (
        <div className={`${card} p-5`}>
          <p className="font-display font-semibold text-ink-900 mb-2">Who can apply</p>
          <RichDescription text={e.eligibility} compact />
        </div>
      )}
      {(e.requiredDocs ?? []).length > 0 && (
        <div className={`${card} p-5`}>
          <p className="font-display font-semibold text-ink-900 mb-2">Documents you will need</p>
          <ul className="grid sm:grid-cols-2 gap-1.5">
            {e.requiredDocs.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm text-ink-700"><CheckCircle2 size={14} className="text-success-600" /> {d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function PosterPage() {
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [via, setVia] = useState<'password' | 'session'>('password')
  const [authLoading, setAuthLoading] = useState(false)
  const [postType, setPostType] = useState<PostType | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [text, setText] = useState('')
  const [image, setImage] = useState<{ data: string; mediaType: string; preview: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState<{ id: string; title: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let saved = ''
    try { saved = sessionStorage.getItem(PW_KEY) ?? '' } catch {}
    post('/api/tools/poster/auth', saved ? { password: saved } : {})
      .then(({ res, data }) => {
        if (res.ok) {
          setAuthed(true); setVia(data.via); setStats(data)
          if (data.via === 'password') setPassword(saved)
        }
      })
      .catch(() => null)
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file) handleImageFile(file)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    const { res, data } = await post('/api/tools/poster/auth', { password }).catch(() => ({ res: null, data: null }))
    setAuthLoading(false)
    if (!res?.ok) { toast.error(data?.error ?? 'Could not sign in'); return }
    try { sessionStorage.setItem(PW_KEY, password) } catch {}
    setAuthed(true); setVia(data.via); setStats(data)
    toast.success(`Welcome, ${data.poster}`)
  }

  function lock() {
    try { sessionStorage.removeItem(PW_KEY) } catch {}
    setAuthed(false); setPassword(''); setStats(null); reset()
  }

  function refreshStats() {
    post('/api/tools/poster/stats', { password }).then(({ res, data }) => { if (res.ok) setStats(data) }).catch(() => null)
  }

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return }
    try { setImage(await compressImage(file)); toast.success('Image added') }
    catch { toast.error('Could not process image') }
  }

  async function handleExtract() {
    if (!text.trim() && !image) { toast.error('Add text or an image first'); return }
    setExtracting(true)
    try {
      const { res, data } = await post('/api/tools/poster/extract', {
        password, postType,
        text: text || undefined,
        image: image ? { data: image.data, mediaType: image.mediaType } : undefined,
      })
      if (!res.ok) { toast.error(data.error ?? 'Extraction failed', { duration: 8000 }); return }
      setExtracted({
        ...data,
        programLevel: data.programLevel ?? [], requiredDocs: data.requiredDocs ?? [],
        fieldTags: data.fieldTags ?? [], skills: data.skills ?? [],
        description: data.description ?? '', eligibility: data.eligibility ?? '',
      })
      setMobileTab('edit')
      if (data.duplicates?.length) toast('This may already be on Xcel360. Check the warning before publishing.', { icon: '⚠️', duration: 6000 })
      else toast.success('Extracted. Review and publish.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Network error', { duration: 8000 }) }
    finally { setExtracting(false) }
  }

  async function handlePublish() {
    if (!extracted) return
    setPublishing(true)
    try {
      const { duplicates: _ignored, ...fields } = extracted
      const { res, data } = await post('/api/tools/poster/publish', { password, ...fields })
      if (!res.ok) { toast.error(data.error ?? `Publish failed (${res.status})`, { duration: 10000 }); return }
      setPublished({ id: data.id, title: data.title })
      toast.success(`Published: "${data.title}"`, { duration: 6000 })
      refreshStats()
    } catch { toast.error('Publish failed') }
    finally { setPublishing(false) }
  }

  function reset() {
    setText(''); setImage(null); setExtracted(null); setPublished(null); setPostType(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function setField<K extends keyof Extracted>(key: K, val: Extracted[K]) {
    setExtracted((p) => p ? { ...p, [key]: val } : p)
  }

  function toggleLevel(val: string) {
    setExtracted((p) => {
      if (!p) return p
      const arr = p.programLevel ?? []
      return { ...p, programLevel: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] }
    })
  }

  const typeConfig = POST_TYPES.find((t) => t.type === postType)

  // Checks shown before publishing. "block" ones disable the Publish button.
  const checks = useMemo(() => {
    if (!extracted) return []
    const out: { level: 'block' | 'warn'; msg: string }[] = []
    const org = extracted.postType === 'SCHOLARSHIP' ? extracted.hostOrg : (extracted.company || extracted.hostOrg)
    if (!extracted.title?.trim()) out.push({ level: 'block', msg: 'Add a title.' })
    if (!org?.trim()) out.push({ level: 'block', msg: `Add the ${extracted.postType === 'SCHOLARSHIP' ? 'host organisation' : 'company'}.` })
    const link = extracted.applicationLink?.trim() ?? ''
    if (link && !isHttpUrl(link) && !isEmail(link)) out.push({ level: 'block', msg: 'The application link must be a full web address (https://…) or an email address.' })
    if (!link) out.push({ level: 'warn', msg: 'No application link or email. Students will not know where to apply.' })
    if (!extracted.deadline) out.push({ level: 'warn', msg: 'No deadline set. It will show as rolling.' })
    else if (new Date(extracted.deadline).getTime() < Date.now() - 86_400_000) out.push({ level: 'warn', msg: 'The deadline is in the past.' })
    const words = (extracted.description ?? '').split(/\s+/).filter(Boolean).length
    if (words < 60) out.push({ level: 'warn', msg: `The description is short (${words} words). Add what it offers and how to apply.` })
    return out
  }, [extracted])
  const blocked = checks.some((c) => c.level === 'block')

  const Header = () => (
    <header className="border-b border-surface-200 bg-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
      <Link href="/" className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="" className="w-8 h-8 rounded-lg" />
        <div className="leading-tight">
          <p className="text-sm font-display font-bold text-ink-900">Xcel360 Poster</p>
          <p className="text-xs text-ink-400">{stats?.poster ? `Signed in as ${stats.poster}` : 'Post opportunities'}</p>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        {postType && (
          <button onClick={reset} className="text-xs text-ink-400 hover:text-ink-700 flex items-center gap-1.5">
            <RotateCcw size={12} /> Start over
          </button>
        )}
        {via === 'password' && (
          <button onClick={lock} className="text-xs text-ink-400 hover:text-ink-700 flex items-center gap-1.5">
            <LogOut size={12} /> Lock
          </button>
        )}
      </div>
    </header>
  )

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-brand-600" />
    </div>
  )

  /* ── Lock screen ── */
  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`w-full max-w-sm ${card} shadow-sm p-7`}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-display font-bold">Xcel360 Poster</h1>
          <p className="text-ink-400 text-sm mt-1">Enter your poster password to continue.</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-3">
          <input type="password" required autoFocus placeholder="Poster password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          <button type="submit" disabled={authLoading}
            className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {authLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Unlock
          </button>
        </form>
        <p className="text-xs text-ink-400 text-center mt-5">
          Xcel360 staff can <Link href="/signin?callbackUrl=/post" className="text-brand-600 hover:underline">sign in</Link> instead.
        </p>
      </div>
    </div>
  )

  /* ── Type selection ── */
  if (!postType) return (
    <>
      <Header />
      <div className="flex justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <StepBar step={0} />
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold">What are you posting?</h1>
            <p className="text-ink-400 text-sm mt-1">Pick a type. The AI writes the listing in the right shape for it.</p>
          </div>

          <div className="space-y-3">
            {POST_TYPES.map(({ type, label: l, sub, icon, tone }) => (
              <button key={type} onClick={() => setPostType(type)}
                className={`w-full flex items-center gap-5 ${card} hover:bg-surface-50 hover:border-brand-300 px-5 py-4 text-left transition-all group`}>
                <div className={`w-12 h-12 rounded-xl ${tone} flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform`}>
                  {icon}
                </div>
                <div>
                  <p className="font-semibold">{l}</p>
                  <p className="text-ink-400 text-sm mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {stats && (
            <div className={`mt-6 ${card} px-5 py-4`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Your activity</p>
                  <p className="font-semibold capitalize mt-0.5">{stats.poster}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-xs text-ink-400">this month</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-ink-400 mb-1">
                <span>{stats.thisMonth} / {MONTHLY_GOAL} posts</span>
                <span>{Math.round(Math.min((stats.thisMonth / MONTHLY_GOAL) * 100, 100))}%</span>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    stats.thisMonth >= MONTHLY_GOAL ? 'bg-success-600'
                    : stats.thisMonth >= MONTHLY_GOAL * 0.6 ? 'bg-warning-600' : 'bg-brand-600'}`}
                  style={{ width: `${Math.min((stats.thisMonth / MONTHLY_GOAL) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-400 mt-2">{stats.allTime} posts all time</p>

              {(stats.recent?.length ?? 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-200">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Your recent posts</p>
                  <ul className="space-y-1.5">
                    {stats.recent!.map((r) => (
                      <li key={r.opportunityId} className="flex items-center justify-between gap-3 text-sm">
                        <a href={`/opportunities/${r.opportunityId}`} target="_blank" rel="noopener noreferrer"
                          className="truncate text-ink-700 hover:text-brand-600 hover:underline">{r.title}</a>
                        <span className="text-xs text-ink-400 shrink-0">{fmtDate(r.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )

  /* ── Success ── */
  if (published) return (
    <>
      <Header />
      <div className="flex justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <StepBar step={3} />
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={40} className="text-success-600" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Published</h2>
            <p className="text-ink-600 mb-1 text-sm font-medium">{published.title}</p>
            <p className="text-ink-400 text-xs mb-8">Now live on Xcel360. It can take up to 5 minutes to appear in listings.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={reset}
                className="flex items-center gap-2 bg-white border border-surface-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-100">
                <RotateCcw size={14} /> Post another
              </button>
              <button onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/opportunities/${published.id}`)
                    .then(() => toast.success('Link copied')).catch(() => toast.error('Could not copy'))
                }}
                className="flex items-center gap-2 bg-white border border-surface-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-surface-100">
                <Copy size={14} /> Copy link
              </button>
              <a href={`/opportunities/${published.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
                <ExternalLink size={14} /> View live
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  /* ── Source input ── */
  if (!extracted) return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <StepBar step={1} />
        <h2 className="text-xl font-display font-bold mb-1">Add the {typeConfig?.label.toLowerCase()} source</h2>
        <p className="text-ink-400 text-sm mb-6">Upload or paste a flyer, paste the text from the official page, or both. More source text gives a more detailed listing.</p>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div>
            <p className={label}>Image</p>
            {image ? (
              <div className="relative rounded-2xl overflow-hidden border border-surface-300 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.preview} alt="Flyer" className="w-full h-60 object-contain" />
                <button onClick={() => setImage(null)} aria-label="Remove image"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink-900/70 text-white flex items-center justify-center hover:bg-ink-900">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleImageFile(f) }}
                className={`w-full h-60 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
                  dragging ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-surface-300 bg-white text-ink-400 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600'}`}>
                <ImageIcon size={28} />
                <span className="text-sm font-medium">Drop an image, click to upload, or Ctrl+V</span>
                <span className="text-xs">JPG, PNG, WebP</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <p className={label}>Text</p>
              <span className="text-xs text-ink-300">{text.length.toLocaleString()} / 20,000</span>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 20_000))}
              placeholder={`Paste the ${typeConfig?.label.toLowerCase()} announcement, email or official web page text…`}
              className={`${input} rounded-2xl resize-none h-60`} />
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-ink-500 bg-accent-50 border border-accent-100 rounded-xl px-3 py-2.5 mb-5">
          <Info size={14} className="shrink-0 mt-0.5 text-accent-600" />
          <span>Tip: flyers often leave out benefits and documents. Paste the text of the official page as well, and include the application link.</span>
        </div>

        <button onClick={handleExtract} disabled={extracting || (!text.trim() && !image)}
          className="w-full bg-brand-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
          {extracting
            ? <><Loader2 size={16} className="animate-spin" /> Writing the listing… (10-20 seconds)</>
            : <><Sparkles size={16} /> Extract & write listing</>}
        </button>
      </div>
    </>
  )

  /* ── Review ── */
  const e = extracted
  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <StepBar step={2} />
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h2 className="text-xl font-display font-bold">Review & publish</h2>
            <p className="text-ink-400 text-sm">Check every field against the source. The preview shows how it will look on the site.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleExtract} disabled={extracting} className="text-xs text-ink-500 hover:text-brand-600 flex items-center gap-1.5 disabled:opacity-50">
              {extracting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Re-write
            </button>
            <button onClick={() => setExtracted(null)} className="text-xs text-ink-500 hover:text-ink-800 flex items-center gap-1.5">
              <FileText size={12} /> Edit source
            </button>
          </div>
        </div>

        {(e.duplicates?.length ?? 0) > 0 && (
          <div className="mb-5 bg-warning-50 border border-warning-100 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-warning-700 flex items-center gap-2"><AlertTriangle size={15} /> This may already be on Xcel360</p>
            <ul className="mt-2 space-y-1">
              {e.duplicates!.map((d) => (
                <li key={d.id} className="text-sm text-ink-700">
                  <a href={`/opportunities/${d.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">{d.title}</a>
                  <span className="text-ink-400"> · {d.hostOrg} · posted {fmtDate(d.createdAt)}{d.status === 'CLOSED' ? ' · closed' : ''}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-500 mt-2">Open them to check. Only publish if this is a different opportunity or a new intake.</p>
          </div>
        )}

        {/* Mobile tab switch */}
        <div className="lg:hidden flex bg-surface-100 rounded-xl p-1 mb-5">
          {(['edit', 'preview'] as const).map((t) => (
            <button key={t} onClick={() => setMobileTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${mobileTab === t ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500'}`}>
              {t === 'edit' ? <><Pencil size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-6 items-start">
          {/* ── Form ── */}
          <div className={`${mobileTab === 'preview' ? 'hidden lg:block' : ''} space-y-5`}>
            <section className={`${card} p-5`}>
              <p className="font-display font-semibold mb-4">Basics</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={label}>Title *</label>
                  <input value={e.title ?? ''} onChange={(ev) => setField('title', ev.target.value)} className={input} />
                </div>
                {postType === 'SCHOLARSHIP' ? (
                  <div>
                    <label className={label}>Host organisation *</label>
                    <input value={e.hostOrg ?? ''} onChange={(ev) => setField('hostOrg', ev.target.value)} className={input} />
                  </div>
                ) : (
                  <div>
                    <label className={label}>Company / organisation *</label>
                    <input value={e.company ?? ''} onChange={(ev) => setExtracted((p) => p ? { ...p, company: ev.target.value, hostOrg: ev.target.value } : p)} className={input} />
                  </div>
                )}
                <div>
                  <label className={label}>Country</label>
                  <input value={e.country ?? ''} onChange={(ev) => setField('country', ev.target.value)} className={input} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>Application link (URL or email)</label>
                  <input value={e.applicationLink ?? ''} onChange={(ev) => setField('applicationLink', ev.target.value)}
                    placeholder="https://… or apply@…" className={input} />
                </div>
                <div>
                  <label className={label}>Deadline</label>
                  <input type="date" value={e.deadline ?? ''} onChange={(ev) => setField('deadline', ev.target.value || null)} className={input} />
                </div>
                <div>
                  <label className={label}>Field</label>
                  <select value={e.field} onChange={(ev) => setField('field', ev.target.value)} className={input}>
                    {FIELDS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>

                {postType === 'SCHOLARSHIP' && (
                  <div>
                    <label className={label}>Funding type</label>
                    <select value={e.fundingType} onChange={(ev) => setField('fundingType', ev.target.value)} className={input}>
                      {FUNDING_TYPES.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                )}

                {postType !== 'SCHOLARSHIP' && (
                  <>
                    <div>
                      <label className={label}>{postType === 'JOB' ? 'Job type' : 'Internship type'}</label>
                      <select value={e.jobType ?? ''} onChange={(ev) => setField('jobType', ev.target.value)} className={input}>
                        {(postType === 'JOB' ? JOB_TYPES : INTERNSHIP_TYPES).map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    {postType === 'JOB' && (
                      <div>
                        <label className={label}>Experience level</label>
                        <select value={e.experienceLevel ?? ''} onChange={(ev) => setField('experienceLevel', ev.target.value)} className={input}>
                          {EXP_LEVELS.map((f) => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className={label}>Salary / stipend</label>
                      <input value={e.salary ?? ''} onChange={(ev) => setField('salary', ev.target.value)}
                        placeholder="e.g. ₦400,000 / month, Unpaid" className={input} />
                    </div>
                    <div className="flex items-center gap-3 sm:pt-6">
                      <input type="checkbox" id="remote" checked={e.remote ?? false}
                        onChange={(ev) => setField('remote', ev.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
                      <label htmlFor="remote" className="text-sm text-ink-600">Remote / hybrid</label>
                    </div>
                  </>
                )}
              </div>

              {postType !== 'JOB' && (
                <div className="mt-4">
                  <label className={label}>Program level</label>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                      <button key={l} type="button" onClick={() => toggleLevel(l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          e.programLevel?.includes(l)
                            ? 'bg-brand-600 border-brand-600 text-white'
                            : 'bg-white border-surface-300 text-ink-500 hover:border-brand-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className={`${card} p-5`}>
              <div className="flex items-baseline justify-between mb-1.5">
                <p className="font-display font-semibold">Description</p>
                <span className="text-xs text-ink-300">{(e.description ?? '').split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <p className="text-xs text-ink-400 mb-3">
                <code className="bg-surface-100 px-1 rounded">### Heading</code> for a section,
                <code className="bg-surface-100 px-1 rounded ml-1">• </code> for a bullet,
                <code className="bg-surface-100 px-1 rounded ml-1">**bold**</code> for key facts.
              </p>
              <textarea value={e.description ?? ''} onChange={(ev) => setField('description', ev.target.value)} rows={14}
                className={`${input} resize-y font-mono text-[13px] leading-relaxed`} />

              <label className={`${label} mt-5`}>Eligibility (who can apply)</label>
              <textarea value={e.eligibility ?? ''} onChange={(ev) => setField('eligibility', ev.target.value)} rows={6}
                className={`${input} resize-y font-mono text-[13px] leading-relaxed`} />
            </section>

            <section className={`${card} p-5 space-y-4`}>
              <p className="font-display font-semibold">Lists</p>
              <div>
                <label className={label}>Documents required</label>
                <ChipInput value={e.requiredDocs ?? []} onChange={(v) => setField('requiredDocs', v)}
                  placeholder="Type and press Enter" suggestions={DOC_SUGGESTIONS} />
              </div>
              {postType !== 'SCHOLARSHIP' && (
                <div>
                  <label className={label}>Skills</label>
                  <ChipInput value={e.skills ?? []} onChange={(v) => setField('skills', v)} placeholder="e.g. Excel, Python" />
                </div>
              )}
              <div>
                <label className={label}>Tags (help students find it)</label>
                <ChipInput value={e.fieldTags ?? []} onChange={(v) => setField('fieldTags', v)} placeholder="e.g. Engineering, Public Health" />
              </div>
            </section>
          </div>

          {/* ── Preview + publish ── */}
          <div className={`${mobileTab === 'edit' ? 'hidden lg:block' : ''} lg:sticky lg:top-20 space-y-4`}>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider flex items-center gap-1.5"><Eye size={13} /> Live preview</p>
            <div className="lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto lg:pr-1">
              <Preview e={e} typeLabel={typeConfig?.label ?? ''} chip={typeConfig?.chip ?? ''} />
            </div>
          </div>
        </div>

        {/* ── Checks + publish (always visible at the bottom) ── */}
        <div className={`${card} p-5 mt-6`}>
          {checks.length > 0 ? (
            <ul className="space-y-1.5 mb-4">
              {checks.map((c) => (
                <li key={c.msg} className={`text-sm flex items-start gap-2 ${c.level === 'block' ? 'text-danger-600' : 'text-warning-700'}`}>
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {c.msg}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-success-700 flex items-center gap-2 mb-4"><CheckCircle2 size={15} /> All checks passed.</p>
          )}
          <button onClick={handlePublish} disabled={publishing || blocked}
            className="w-full bg-brand-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {publishing
              ? <><Loader2 size={16} className="animate-spin" /> Publishing…</>
              : <><Send size={16} /> Publish {typeConfig?.label.toLowerCase()} to Xcel360</>}
          </button>
        </div>
      </div>
    </>
  )
}
