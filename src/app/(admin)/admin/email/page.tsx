'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Users, Mail, Clock, CheckCircle, XCircle, Loader2,
  RefreshCw, Bold, Italic, Underline, Link, List, ListOrdered,
  Quote, Minus, Undo, Redo, Paperclip, X, Upload, ChevronDown,
  FileText, Image, File, Save, Code,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type Campaign = {
  id: string
  subject: string
  audience: string
  status: string
  totalCount: number
  sentCount: number
  dailyLimit: number
  createdAt: string
  attachments: string
  ccRecipients: string
}

type AttachmentMeta = {
  filename: string
  url: string
  contentType: string
  size: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValidEmail = (e: string) => EMAIL_RE.test(e.trim())

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith('image/')) return <Image className="h-3.5 w-3.5" />
  if (contentType.includes('pdf')) return <FileText className="h-3.5 w-3.5" />
  return <File className="h-3.5 w-3.5" />
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',   icon: <Clock className="h-3 w-3" /> },
    SENDING:   { label: 'Sending…',  color: 'bg-blue-100 text-blue-700',   icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    FAILED:    { label: 'Failed',    color: 'bg-red-100 text-red-700',     icon: <XCircle className="h-3 w-3" /> },
  }
  const s = map[status] ?? map.DRAFT
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.icon}{s.label}
    </span>
  )
}

// ─── ChipInput ────────────────────────────────────────────────────────────────

function ChipInput({
  chips,
  onChange,
  placeholder = 'Add email…',
}: {
  chips: string[]
  onChange: (chips: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = (raw: string) => {
    const emails = raw.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(isValidEmail)
    const next = Array.from(new Set([...chips, ...emails]))
    if (next.length > chips.length) onChange(next)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault()
      if (input) add(input)
    } else if (e.key === 'Backspace' && !input && chips.length) {
      onChange(chips.slice(0, -1))
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    add(e.clipboardData.getData('text'))
  }

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border border-gray-200 rounded-xl min-h-[44px] focus-within:ring-2 focus-within:ring-brand-500 bg-white">
      {chips.map(email => (
        <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium max-w-[220px]">
          <span className="truncate">{email}</span>
          <button
            type="button"
            onClick={() => onChange(chips.filter(c => c !== email))}
            className="shrink-0 hover:text-red-500 transition-colors ml-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => { if (input) add(input) }}
        placeholder={chips.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[180px] text-sm outline-none bg-transparent py-0.5 px-1"
      />
    </div>
  )
}

// ─── CsvImport ────────────────────────────────────────────────────────────────

function CsvImport({ onImport }: { onImport: (emails: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const emails = text
        .split(/[\n\r]+/)
        .map(line => line.split(',')[0].trim().toLowerCase())
        .filter(isValidEmail)
      if (emails.length) {
        onImport(emails)
        toast.success(`Imported ${emails.length} email${emails.length > 1 ? 's' : ''}`)
      } else {
        toast.error('No valid emails found in CSV')
      }
    }
    reader.readAsText(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Import CSV
      </button>
    </>
  )
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────

function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const [sourceMode, setSourceMode] = useState(false)

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value
      initialized.current = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Allow external reset (value === '' after send)
  useEffect(() => {
    if (editorRef.current && value === '' && initialized.current) {
      editorRef.current.innerHTML = ''
    }
  }, [value])

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val ?? undefined)
    handleInput()
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }

  const toggleSource = () => {
    if (!sourceMode) {
      // switching TO source: show raw HTML in textarea
      setSourceMode(true)
    } else {
      // switching FROM source: apply textarea value as rendered HTML
      if (editorRef.current) {
        const ta = document.getElementById('html-source-textarea') as HTMLTextAreaElement | null
        if (ta) {
          editorRef.current.innerHTML = ta.value
          onChange(ta.value)
        }
      }
      setSourceMode(false)
    }
  }

  const TB = ({ onClick, icon, title, active }: { onClick: () => void; icon: React.ReactNode; title: string; active?: boolean }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-brand-100 text-brand-700' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
    >
      {icon}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
        {!sourceMode && <>
          <TB onClick={() => exec('bold')}                          icon={<Bold className="h-3.5 w-3.5" />}        title="Bold" />
          <TB onClick={() => exec('italic')}                        icon={<Italic className="h-3.5 w-3.5" />}      title="Italic" />
          <TB onClick={() => exec('underline')}                     icon={<Underline className="h-3.5 w-3.5" />}   title="Underline" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <TB onClick={insertLink}                                  icon={<Link className="h-3.5 w-3.5" />}        title="Insert link" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <TB onClick={() => exec('insertUnorderedList')}           icon={<List className="h-3.5 w-3.5" />}        title="Bullet list" />
          <TB onClick={() => exec('insertOrderedList')}             icon={<ListOrdered className="h-3.5 w-3.5" />} title="Numbered list" />
          <TB onClick={() => exec('formatBlock', 'blockquote')}     icon={<Quote className="h-3.5 w-3.5" />}       title="Blockquote" />
          <TB onClick={() => exec('insertHorizontalRule')}          icon={<Minus className="h-3.5 w-3.5" />}       title="Horizontal rule" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <TB onClick={() => exec('undo')}                          icon={<Undo className="h-3.5 w-3.5" />}        title="Undo" />
          <TB onClick={() => exec('redo')}                          icon={<Redo className="h-3.5 w-3.5" />}        title="Redo" />
          <TB onClick={() => exec('removeFormat')}                  icon={<X className="h-3.5 w-3.5" />}           title="Clear formatting" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
        </>}
        <TB onClick={toggleSource} icon={<Code className="h-3.5 w-3.5" />} title={sourceMode ? 'Apply HTML & switch to visual' : 'Edit raw HTML'} active={sourceMode} />
        {sourceMode && <span className="text-xs text-brand-600 font-medium ml-1">HTML source — paste your code, then click <Code className="inline h-3 w-3" /> to apply</span>}
      </div>

      {/* Visual editor */}
      <div
        ref={editorRef}
        contentEditable={!sourceMode}
        suppressContentEditableWarning
        onInput={handleInput}
        className={`min-h-[280px] px-4 py-3 text-sm text-gray-800 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${sourceMode ? 'hidden' : ''}`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      />

      {/* Source textarea */}
      {sourceMode && (
        <textarea
          id="html-source-textarea"
          defaultValue={value}
          className="w-full min-h-[280px] px-4 py-3 text-xs font-mono text-gray-800 outline-none bg-gray-950 text-green-400 resize-y"
          placeholder="Paste your HTML here, then click the </> button above to apply it..."
          spellCheck={false}
        />
      )}
    </div>
  )
}

// ─── AttachmentUploader ───────────────────────────────────────────────────────

function AttachmentUploader({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: AttachmentMeta[]
  onAdd: (a: AttachmentMeta) => void
  onRemove: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10 MB`); return }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/email/attachments', { method: 'POST', body: fd })
    if (!res.ok) { toast.error(`Failed to upload ${file.name}`); return }
    onAdd(await res.json())
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    await Promise.all(Array.from(files).map(uploadFile))
    setUploading(false)
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm
          ${dragOver ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'}`}
      >
        {uploading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
          : <><Paperclip className="h-4 w-4" /> Drag & drop or click to attach (PDF, DOCX, images — max 10 MB)</>
        }
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      {attachments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {attachments.map(a => (
            <div key={a.url} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-700">
              <span className="text-gray-400"><FileIcon contentType={a.contentType} /></span>
              <span className="flex-1 truncate font-medium">{a.filename}</span>
              <span className="text-gray-400 shrink-0">{formatBytes(a.size)}</span>
              <button type="button" onClick={() => onRemove(a.url)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CampaignCard ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const pct = c.totalCount > 0 ? Math.round((c.sentCount / c.totalCount) * 100) : 0
  const audienceLabel: Record<string, string> = {
    users: 'Registered users', subscribers: 'Subscribers',
    both: 'Everyone', none: 'Manual list',
  }

  let attachCount = 0
  try { attachCount = JSON.parse(c.attachments ?? '[]').length } catch { /* empty */ }
  let ccCount = 0
  try { ccCount = JSON.parse(c.ccRecipients ?? '[]').length } catch { /* empty */ }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{c.subject}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{audienceLabel[c.audience] ?? c.audience}</span>
            <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {attachCount > 0 && <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{attachCount} attachment{attachCount > 1 ? 's' : ''}</span>}
            {ccCount > 0 && <span>{ccCount} CC</span>}
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{c.sentCount.toLocaleString()} / {c.totalCount.toLocaleString()} sent</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${c.status === 'COMPLETED' ? 'bg-green-500' : c.status === 'FAILED' ? 'bg-red-400' : c.status === 'DRAFT' ? 'bg-gray-400' : 'bg-brand-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {c.status === 'SENDING' && (
          <p className="text-xs text-gray-400 mt-1.5">
            {(c.totalCount - c.sentCount).toLocaleString()} remaining · {c.dailyLimit}/day · next batch tomorrow at 7am
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Audience options ─────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: 'none',        label: 'Manual only',            desc: 'Send only to addresses entered in To field' },
  { value: 'users',       label: 'Registered users',       desc: 'All accounts in the platform' },
  { value: 'subscribers', label: 'Newsletter subscribers', desc: 'Homepage email signups' },
  { value: 'both',        label: 'Everyone',               desc: 'Users + subscribers (deduplicated)' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminEmailPage() {
  const [tab, setTab] = useState<'compose' | 'campaigns'>('compose')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)

  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [toChips, setToChips] = useState<string[]>([])
  const [ccChips, setCcChips] = useState<string[]>([])
  const [bccChips, setBccChips] = useState<string[]>([])
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [audience, setAudience] = useState('subscribers')
  const [dailyLimit, setDailyLimit] = useState(100)
  const [sendAll, setSendAll] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [preview, setPreview] = useState(false)

  const loadCampaigns = async () => {
    setLoadingCampaigns(true)
    try {
      const res = await fetch('/api/admin/email')
      if (res.ok) setCampaigns(await res.json())
    } finally {
      setLoadingCampaigns(false)
    }
  }

  useEffect(() => { loadCampaigns() }, [])

  const resetForm = () => {
    setSubject(''); setHtmlBody(''); setToChips([]); setCcChips([])
    setBccChips([]); setAttachments([]); setPreview(false); setShowCcBcc(false)
  }

  const buildPayload = (isDraft: boolean) => ({
    subject, htmlBody, audience, dailyLimit, sendAll,
    manualRecipients: toChips, ccRecipients: ccChips,
    bccRecipients: bccChips, attachments, isDraft,
  })

  const validate = () => {
    if (!subject.trim()) { toast.error('Subject is required'); return false }
    if (!htmlBody.trim()) { toast.error('Email body is required'); return false }
    if (audience === 'none' && toChips.length === 0) {
      toast.error('Add at least one recipient or choose an audience group')
      return false
    }
    return true
  }

  const handleSaveDraft = async () => {
    if (!validate()) return
    setSavingDraft(true)
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true)),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Save failed'); return }
      toast.success('Draft saved')
      resetForm(); setTab('campaigns'); loadCampaigns()
    } catch { toast.error('Something went wrong') }
    finally { setSavingDraft(false) }
  }

  const handleSend = async () => {
    if (!validate()) return
    const audienceLabel = AUDIENCE_OPTIONS.find(a => a.value === audience)?.label ?? audience
    const summary = audience === 'none'
      ? `${toChips.length} manual recipient${toChips.length > 1 ? 's' : ''}`
      : audienceLabel + (toChips.length ? ` + ${toChips.length} manual` : '')
    if (!confirm(`Send to ${summary}? This cannot be undone.`)) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false)),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Send failed'); return }

      if (data.status === 'COMPLETED') {
        toast.success(`Sent to all ${data.sent} recipients!`)
      } else {
        toast.success(`Sent first ${data.sent} of ${data.total}. ${data.remaining} will send tomorrow at 7am.`)
      }
      resetForm(); setTab('campaigns'); loadCampaigns()
    } catch { toast.error('Something went wrong') }
    finally { setSending(false) }
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'SENDING')
  const completedCampaigns = campaigns.filter(c => c.status !== 'SENDING')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email</h1>
          <p className="text-gray-500 mt-1">Send campaigns to users and subscribers via Resend</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('compose')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'compose' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Compose
          </button>
          <button
            onClick={() => { setTab('campaigns'); loadCampaigns() }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'campaigns' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Campaigns
            {activeCampaigns.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {activeCampaigns.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Compose Tab ── */}
      {tab === 'compose' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — email fields + editor + attachments */}
          <div className="lg:col-span-2 space-y-4">
            {/* Email header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
              {/* From */}
              <div className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0">From</span>
                <span className="text-gray-500 text-xs">Xcel360 via Resend</span>
              </div>

              {/* To */}
              <div className="flex items-start gap-3 px-5 py-3">
                <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0 mt-2.5">To</span>
                <div className="flex-1 min-w-0">
                  <ChipInput
                    chips={toChips}
                    onChange={setToChips}
                    placeholder="Type email + Enter, or paste multiple, or import CSV…"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <CsvImport onImport={emails => setToChips(prev => Array.from(new Set([...prev, ...emails])))} />
                    {toChips.length > 0 && (
                      <span className="text-xs text-gray-400">{toChips.length} address{toChips.length > 1 ? 'es' : ''}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCcBcc(v => !v)}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      CC / BCC
                      <ChevronDown className={`h-3 w-3 transition-transform ${showCcBcc ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* CC / BCC */}
              {showCcBcc && (
                <>
                  <div className="flex items-start gap-3 px-5 py-3">
                    <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0 mt-2.5">CC</span>
                    <div className="flex-1">
                      <ChipInput chips={ccChips} onChange={setCcChips} placeholder="CC recipients…" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-5 py-3">
                    <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0 mt-2.5">BCC</span>
                    <div className="flex-1">
                      <ChipInput chips={bccChips} onChange={setBccChips} placeholder="BCC recipients…" />
                    </div>
                  </div>
                </>
              )}

              {/* Subject */}
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0">Subj</span>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Email subject line…"
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                />
              </div>
            </div>

            {/* Editor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Message</span>
                <button
                  onClick={() => setPreview(v => !v)}
                  className="text-xs text-brand-700 font-medium hover:text-brand-800"
                >
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {preview ? (
                <div
                  className="min-h-[280px] border border-gray-200 rounded-xl p-4 overflow-auto text-sm"
                  dangerouslySetInnerHTML={{ __html: htmlBody }}
                />
              ) : (
                <RichTextEditor value={htmlBody} onChange={setHtmlBody} />
              )}
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Attachments</p>
              <AttachmentUploader
                attachments={attachments}
                onAdd={a => setAttachments(prev => [...prev, a])}
                onRemove={url => setAttachments(prev => prev.filter(a => a.url !== url))}
              />
            </div>
          </div>

          {/* Right — audience + settings + actions */}
          <div className="space-y-4">
            {/* Audience */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Audience group</label>
              <div className="space-y-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors
                      ${audience === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={opt.value}
                      checked={audience === opt.value}
                      onChange={() => setAudience(opt.value)}
                      className="mt-0.5 text-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Send settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Send settings</label>
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendAll}
                  onChange={e => setSendAll(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span className="text-sm text-gray-700">Send all at once</span>
              </label>
              {!sendAll && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Daily limit <span className="text-gray-400">(max 100 on free plan)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={dailyLimit}
                    onChange={e => setDailyLimit(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Remaining emails continue at 7am each day.</p>
                </div>
              )}
              {sendAll && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                  Sending all at once may hit Resend's daily limit. Upgrade Resend for higher limits.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleSend}
                disabled={sending || savingDraft || !subject.trim() || !htmlBody.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-700 text-white rounded-xl font-semibold hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send Campaign'}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={sending || savingDraft || !subject.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingDraft ? 'Saving…' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Campaigns Tab ── */}
      {tab === 'campaigns' && (
        <div className="space-y-6">
          {activeCampaigns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active</h2>
                <button onClick={loadCampaigns} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
              <div className="space-y-3">
                {activeCampaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
              </div>
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {activeCampaigns.length > 0 ? 'History' : 'All Campaigns'}
            </h2>
            {loadingCampaigns ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
            ) : completedCampaigns.length === 0 && activeCampaigns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Mail className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No campaigns yet</p>
                <p className="text-sm text-gray-400 mt-1">Compose your first email to get started.</p>
                <button onClick={() => setTab('compose')} className="mt-4 text-brand-700 text-sm font-medium">
                  Compose now →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {completedCampaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
