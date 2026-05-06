'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Users, Mail, Clock, CheckCircle, XCircle, Loader2, RefreshCw,
  Bold, Italic, Underline, Link, List, ListOrdered, Quote, Minus,
  Undo, Redo, Paperclip, X, Upload, ChevronDown, FileText, Image,
  File, Save, Code, FlaskConical, BookOpen, Trash2, Play, Ban,
  ChevronLeft, ChevronRight, AlertCircle, Layers,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type Campaign = {
  id: string; subject: string; audience: string; status: string
  totalCount: number; sentCount: number; dailyLimit: number
  createdAt: string; attachments: string; ccRecipients: string
}
type Template = { id: string; name: string; subject: string; htmlBody: string; updatedAt: string }
type LogEntry = { id: string; campaignId: string; to: string; status: string; error: string | null; sentAt: string }
type AttachmentMeta = { filename: string; url: string; contentType: string; size: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValidEmail = (e: string) => EMAIL_RE.test(e.trim())
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT:      { label: 'Draft',      color: 'bg-gray-100 text-gray-600',    icon: <Clock className="h-3 w-3" /> },
    SENDING:    { label: 'Sending…',   color: 'bg-blue-100 text-blue-700',    icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    COMPLETED:  { label: 'Completed',  color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="h-3 w-3" /> },
    FAILED:     { label: 'Failed',     color: 'bg-red-100 text-red-700',      icon: <XCircle className="h-3 w-3" /> },
    CANCELLED:  { label: 'Cancelled',  color: 'bg-orange-100 text-orange-700',icon: <Ban className="h-3 w-3" /> },
  }
  const s = map[status] ?? map.DRAFT
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.icon}{s.label}
    </span>
  )
}

// ─── ChipInput ────────────────────────────────────────────────────────────────

function ChipInput({ chips, onChange, placeholder = 'Add email…' }: { chips: string[]; onChange: (c: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('')
  const add = (raw: string) => {
    const emails = raw.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(isValidEmail)
    const next = Array.from(new Set([...chips, ...emails]))
    if (next.length > chips.length) onChange(next)
    setInput('')
  }
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border border-gray-200 rounded-xl min-h-[44px] focus-within:ring-2 focus-within:ring-brand-500 bg-white">
      {chips.map(email => (
        <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium max-w-[220px]">
          <span className="truncate">{email}</span>
          <button type="button" onClick={() => onChange(chips.filter(c => c !== email))} className="shrink-0 hover:text-red-500 transition-colors ml-0.5">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (['Enter', ',', 'Tab'].includes(e.key)) { e.preventDefault(); if (input) add(input) } else if (e.key === 'Backspace' && !input && chips.length) onChange(chips.slice(0, -1)) }}
        onPaste={e => { e.preventDefault(); add(e.clipboardData.getData('text')) }}
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
    reader.onload = e => {
      const emails = (e.target?.result as string).split(/[\n\r]+/).map(l => l.split(',')[0].trim().toLowerCase()).filter(isValidEmail)
      emails.length ? (onImport(emails), toast.success(`Imported ${emails.length} emails`)) : toast.error('No valid emails found')
    }
    reader.readAsText(file)
  }
  return (
    <>
      <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
      <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <Upload className="h-3.5 w-3.5" /> Import CSV
      </button>
    </>
  )
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const [sourceMode, setSourceMode] = useState(false)

  useEffect(() => { if (editorRef.current && !initialized.current) { editorRef.current.innerHTML = value; initialized.current = true } }, []) // eslint-disable-line
  useEffect(() => { if (editorRef.current && value === '' && initialized.current) editorRef.current.innerHTML = '' }, [value])

  const handleInput = useCallback(() => { if (editorRef.current) onChange(editorRef.current.innerHTML) }, [onChange])
  const exec = (cmd: string, val?: string) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); handleInput() }
  const insertLink = () => { const url = window.prompt('Enter URL:', 'https://'); if (url) exec('createLink', url) }
  const toggleSource = () => {
    if (!sourceMode) { setSourceMode(true) } else {
      const ta = document.getElementById('html-source-ta') as HTMLTextAreaElement | null
      if (ta && editorRef.current) { editorRef.current.innerHTML = ta.value; onChange(ta.value) }
      setSourceMode(false)
    }
  }
  const TB = ({ onClick, icon, title, active }: { onClick: () => void; icon: React.ReactNode; title: string; active?: boolean }) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick() }} title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-brand-100 text-brand-700' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
      {icon}
    </button>
  )
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
        {!sourceMode && <>
          <TB onClick={() => exec('bold')} icon={<Bold className="h-3.5 w-3.5" />} title="Bold" />
          <TB onClick={() => exec('italic')} icon={<Italic className="h-3.5 w-3.5" />} title="Italic" />
          <TB onClick={() => exec('underline')} icon={<Underline className="h-3.5 w-3.5" />} title="Underline" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <TB onClick={insertLink} icon={<Link className="h-3.5 w-3.5" />} title="Insert link" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <TB onClick={() => exec('insertUnorderedList')} icon={<List className="h-3.5 w-3.5" />} title="Bullet list" />
          <TB onClick={() => exec('insertOrderedList')} icon={<ListOrdered className="h-3.5 w-3.5" />} title="Numbered list" />
          <TB onClick={() => exec('formatBlock', 'blockquote')} icon={<Quote className="h-3.5 w-3.5" />} title="Blockquote" />
          <TB onClick={() => exec('insertHorizontalRule')} icon={<Minus className="h-3.5 w-3.5" />} title="Horizontal rule" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <TB onClick={() => exec('undo')} icon={<Undo className="h-3.5 w-3.5" />} title="Undo" />
          <TB onClick={() => exec('redo')} icon={<Redo className="h-3.5 w-3.5" />} title="Redo" />
          <TB onClick={() => exec('removeFormat')} icon={<X className="h-3.5 w-3.5" />} title="Clear formatting" />
          <div className="w-px h-4 bg-gray-200 mx-1" />
        </>}
        <TB onClick={toggleSource} icon={<Code className="h-3.5 w-3.5" />} title={sourceMode ? 'Apply HTML' : 'Edit raw HTML'} active={sourceMode} />
        {sourceMode && <span className="text-xs text-brand-600 font-medium ml-1">HTML source — click <Code className="inline h-3 w-3" /> to apply</span>}
      </div>
      <div ref={editorRef} contentEditable={!sourceMode} suppressContentEditableWarning onInput={handleInput}
        className={`min-h-[280px] px-4 py-3 text-sm text-gray-800 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ${sourceMode ? 'hidden' : ''}`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />
      {sourceMode && <textarea id="html-source-ta" defaultValue={value} className="w-full min-h-[280px] px-4 py-3 text-xs font-mono text-green-400 bg-gray-950 outline-none resize-y" spellCheck={false} />}
    </div>
  )
}

// ─── AttachmentUploader ───────────────────────────────────────────────────────

function AttachmentUploader({ attachments, onAdd, onRemove }: { attachments: AttachmentMeta[]; onAdd: (a: AttachmentMeta) => void; onRemove: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const FI = ({ ct }: { ct: string }) => ct.startsWith('image/') ? <Image className="h-3.5 w-3.5" /> : ct.includes('pdf') ? <FileText className="h-3.5 w-3.5" /> : <File className="h-3.5 w-3.5" />

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10 MB`); return }
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/email/attachments', { method: 'POST', body: fd })
    if (!res.ok) { toast.error(`Failed to upload ${file.name}`); return }
    onAdd(await res.json())
  }
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true); await Promise.all(Array.from(files).map(uploadFile)); setUploading(false)
  }
  return (
    <div>
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${dragOver ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'}`}>
        {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Paperclip className="h-4 w-4" /> Drag & drop or click to attach (max 10 MB)</>}
      </div>
      <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      {attachments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {attachments.map(a => (
            <div key={a.url} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-700">
              <span className="text-gray-400"><FI ct={a.contentType} /></span>
              <span className="flex-1 truncate font-medium">{a.filename}</span>
              <span className="text-gray-400 shrink-0">{formatBytes(a.size)}</span>
              <button type="button" onClick={() => onRemove(a.url)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CampaignCard ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign: c, onAction }: { campaign: Campaign; onAction: () => void }) {
  const [acting, setActing] = useState(false)
  const pct = c.totalCount > 0 ? Math.round((c.sentCount / c.totalCount) * 100) : 0
  const audienceLabel: Record<string, string> = { users: 'Registered users', subscribers: 'Subscribers', both: 'Everyone', none: 'Manual list' }

  const doAction = async (action: 'send' | 'cancel' | 'delete') => {
    if (action === 'cancel' && !confirm('Cancel this campaign? Remaining emails will not be sent.')) return
    if (action === 'delete' && !confirm('Delete this campaign and its logs?')) return
    setActing(true)
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/email/${c.id}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Deleted'); onAction() }
        else { const d = await res.json(); toast.error(d.error ?? 'Delete failed') }
      } else {
        const res = await fetch(`/api/admin/email/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
        const d = await res.json()
        if (res.ok) {
          toast.success(action === 'send' ? `Sending! First batch: ${d.sent}` : 'Cancelled')
          onAction()
        } else { toast.error(d.error ?? 'Action failed') }
      }
    } finally { setActing(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{c.subject}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{audienceLabel[c.audience] ?? c.audience}</span>
            <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
          <div className={`h-1.5 rounded-full transition-all ${c.status === 'COMPLETED' ? 'bg-green-500' : c.status === 'FAILED' ? 'bg-red-400' : c.status === 'CANCELLED' ? 'bg-orange-400' : c.status === 'DRAFT' ? 'bg-gray-400' : 'bg-brand-600'}`}
            style={{ width: `${pct}%` }} />
        </div>
        {c.status === 'SENDING' && (
          <p className="text-xs text-gray-400 mt-1.5">{(c.totalCount - c.sentCount).toLocaleString()} remaining · {c.dailyLimit}/day · next batch tomorrow at 7am</p>
        )}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
        {c.status === 'DRAFT' && (
          <button onClick={() => doAction('send')} disabled={acting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 text-white rounded-lg text-xs font-semibold hover:bg-brand-800 disabled:opacity-50 transition-colors">
            {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Send Now
          </button>
        )}
        {c.status === 'SENDING' && (
          <button onClick={() => doAction('cancel')} disabled={acting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200 disabled:opacity-50 transition-colors">
            {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />} Cancel
          </button>
        )}
        {['COMPLETED', 'FAILED', 'CANCELLED', 'DRAFT'].includes(c.status) && (
          <button onClick={() => doAction('delete')} disabled={acting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors ml-auto">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Base Templates ───────────────────────────────────────────────────────────

const BASE_TEMPLATES = [
  {
    name: 'General Announcement',
    desc: 'Branded header, body text, and a call-to-action button.',
    preview: 'announcement',
    subject: '[Your Subject Here]',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:linear-gradient(135deg,#0c4a6e,#0284c7);padding:40px 32px;text-align:center;">
    <h1 style="color:#ffffff;font-size:26px;margin:0;">[Your Headline Here]</h1>
  </div>
  <div style="padding:40px 32px;color:#1f2937;">
    <p style="font-size:16px;line-height:1.7;">[Opening paragraph — introduce the announcement and why it matters to your audience.]</p>
    <p style="font-size:16px;line-height:1.7;">[Supporting paragraph — add more context, details, or key information here.]</p>
    <div style="text-align:center;margin:36px 0;">
      <a href="https://xcel360.com" style="display:inline-block;background:#0284c7;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:16px;">[Call to Action]</a>
    </div>
    <p style="font-size:16px;line-height:1.7;">Warm regards,<br/><strong>The Xcel360 Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:13px;color:#9ca3af;margin:0;">© 2025 Xcel360. Empowering scholars across Africa.</p>
  </div>
</div>`,
  },
  {
    name: 'Opportunity Alert',
    desc: 'Scholarship spotlight with deadline badges and a direct apply button.',
    preview: 'opportunity',
    subject: 'New Scholarship Opportunity: [Scholarship Name]',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:linear-gradient(135deg,#0c4a6e,#0284c7);padding:40px 32px;text-align:center;">
    <span style="display:inline-block;background:rgba(255,255,255,0.2);color:#ffffff;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:16px;">New Opportunity</span>
    <h1 style="color:#ffffff;font-size:24px;margin:0;">[Scholarship Name]</h1>
    <p style="color:#bae6fd;margin:8px 0 0;font-size:15px;">Offered by [Organisation Name]</p>
  </div>
  <div style="padding:40px 32px;color:#1f2937;">
    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;">
      <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">Deadline</p>
        <p style="font-size:15px;font-weight:700;color:#0c4a6e;margin:0;">[Date]</p>
      </div>
      <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">Value</p>
        <p style="font-size:15px;font-weight:700;color:#0c4a6e;margin:0;">[Amount]</p>
      </div>
      <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">Open to</p>
        <p style="font-size:15px;font-weight:700;color:#0c4a6e;margin:0;">[Eligibility]</p>
      </div>
    </div>
    <p style="font-size:16px;line-height:1.7;">[Describe the scholarship — what it covers, who it is for, and why this is a great opportunity.]</p>
    <div style="text-align:center;margin:36px 0;">
      <a href="https://xcel360.com/opportunities" style="display:inline-block;background:#0284c7;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:16px;">View &amp; Apply Now</a>
    </div>
    <p style="font-size:14px;color:#6b7280;line-height:1.7;">Don't wait — deadlines fill up fast. Share this with someone who might benefit.</p>
    <p style="font-size:16px;line-height:1.7;margin-top:24px;">Best of luck,<br/><strong>The Xcel360 Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:13px;color:#9ca3af;margin:0;">© 2025 Xcel360. Empowering scholars across Africa.</p>
  </div>
</div>`,
  },
  {
    name: 'Programme Update',
    desc: 'Cohort announcement with numbered highlights and what to expect.',
    preview: 'programme',
    subject: 'Xcel360 Programme Update — [Cohort Name]',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:linear-gradient(135deg,#0c4a6e,#0284c7);padding:40px 32px;text-align:center;">
    <h1 style="color:#ffffff;font-size:26px;margin:0;">Programme Update</h1>
    <p style="color:#bae6fd;margin:8px 0 0;font-size:15px;">[Cohort Name] · [Year]</p>
  </div>
  <div style="padding:40px 32px;color:#1f2937;">
    <p style="font-size:16px;line-height:1.7;">[Opening — share the programme news and set the context for readers.]</p>
    <div style="background:#f0f9ff;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="font-size:14px;font-weight:700;color:#0c4a6e;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.05em;">What to Expect</p>
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
        <span style="background:#0284c7;color:#fff;border-radius:50%;width:24px;height:24px;min-width:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">1</span>
        <p style="margin:4px 0 0;font-size:15px;color:#374151;">[Step or highlight one — describe a key benefit or milestone]</p>
      </div>
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
        <span style="background:#0284c7;color:#fff;border-radius:50%;width:24px;height:24px;min-width:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">2</span>
        <p style="margin:4px 0 0;font-size:15px;color:#374151;">[Step or highlight two]</p>
      </div>
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <span style="background:#0284c7;color:#fff;border-radius:50%;width:24px;height:24px;min-width:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">3</span>
        <p style="margin:4px 0 0;font-size:15px;color:#374151;">[Step or highlight three]</p>
      </div>
    </div>
    <p style="font-size:16px;line-height:1.7;">[Closing — next steps, how to get involved, or a call to action.]</p>
    <div style="text-align:center;margin:36px 0;">
      <a href="https://xcel360.com/programs" style="display:inline-block;background:#0284c7;color:#ffffff;padding:14px 32px;border-radius:8px;font-weight:bold;text-decoration:none;font-size:16px;">Learn More</a>
    </div>
    <p style="font-size:16px;line-height:1.7;">With excitement,<br/><strong>The Xcel360 Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:13px;color:#9ca3af;margin:0;">© 2025 Xcel360. Empowering scholars across Africa.</p>
  </div>
</div>`,
  },
  {
    name: 'Appreciation',
    desc: 'Warm thank-you with a highlighted callout and forward-looking close.',
    preview: 'appreciation',
    subject: 'Thank You for Being Part of Xcel360',
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:linear-gradient(135deg,#0c4a6e,#0284c7);padding:40px 32px;text-align:center;">
    <h1 style="color:#ffffff;font-size:28px;margin:0;">Thank You for Being Part of Xcel360</h1>
  </div>
  <div style="padding:40px 32px;color:#1f2937;">
    <p style="font-size:16px;line-height:1.7;">Dear Scholar,</p>
    <p style="font-size:16px;line-height:1.7;">[Opening — express genuine gratitude and what it means to the team.]</p>
    <p style="font-size:16px;line-height:1.7;">[Supporting paragraph — acknowledge their journey and your commitment to helping them.]</p>
    <div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:20px 24px;margin:32px 0;border-radius:0 8px 8px 0;">
      <p style="font-size:16px;line-height:1.7;margin:0;color:#0c4a6e;font-weight:600;">[Key message — one powerful forward-looking sentence]</p>
      <p style="font-size:15px;line-height:1.7;margin:8px 0 0;color:#374151;">[Supporting detail — what's coming next, what you're working on for them.]</p>
    </div>
    <p style="font-size:16px;line-height:1.7;">[Closing — encouraging and warm. Remind them you're with them every step.]</p>
    <p style="font-size:16px;line-height:1.7;margin-top:32px;">With gratitude,<br/><strong>The Xcel360 Team</strong></p>
  </div>
  <div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:13px;color:#9ca3af;margin:0;">© 2025 Xcel360. Empowering scholars across Africa.</p>
  </div>
</div>`,
  },
]

// ─── TemplateThumbnail ────────────────────────────────────────────────────────

function TemplateThumbnail({ type }: { type: string }) {
  const bar = 'rounded-sm bg-gray-200 h-2'
  return (
    <div className="w-full h-32 bg-white rounded-lg overflow-hidden border border-gray-100 flex flex-col gap-1.5 p-2 select-none pointer-events-none">
      <div className="w-full h-8 rounded-md bg-gradient-to-r from-sky-900 to-sky-500 flex items-center justify-center shrink-0">
        <div className="w-20 h-2 bg-white/50 rounded-full" />
      </div>
      {type === 'opportunity' && <>
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="flex-1 h-5 bg-sky-50 rounded" />)}
        </div>
        <div className={`${bar} w-full`} />
        <div className={`${bar} w-4/5`} />
        <div className="flex justify-center mt-0.5"><div className="w-14 h-3 bg-sky-500 rounded" /></div>
      </>}
      {type === 'programme' && <>
        <div className="bg-sky-50 rounded p-1.5 space-y-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
              <div className={`${bar} flex-1`} />
            </div>
          ))}
        </div>
        <div className="flex justify-center"><div className="w-14 h-3 bg-sky-500 rounded" /></div>
      </>}
      {type === 'appreciation' && <>
        <div className={`${bar} w-full`} />
        <div className={`${bar} w-4/5`} />
        <div className="border-l-2 border-sky-400 pl-1.5 bg-sky-50 rounded-r py-1 space-y-1">
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-3/5`} />
        </div>
        <div className={`${bar} w-2/3`} />
      </>}
      {type === 'announcement' && <>
        <div className={`${bar} w-full`} />
        <div className={`${bar} w-4/5`} />
        <div className={`${bar} w-full`} />
        <div className="flex justify-center mt-0.5"><div className="w-14 h-3 bg-sky-500 rounded" /></div>
      </>}
      <div className="mt-auto h-3 bg-gray-50 rounded flex items-center justify-center shrink-0">
        <div className="w-16 h-1 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}

// ─── TemplateGallery ──────────────────────────────────────────────────────────

function TemplateGallery({ onSelect, onClose }: { onSelect: (subject: string, html: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-400 mt-0.5">Pick a design — all placeholder text is editable</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {BASE_TEMPLATES.map(t => (
              <div key={t.name}
                onClick={() => { onSelect(t.subject, t.html); onClose() }}
                className="border border-gray-100 rounded-2xl overflow-hidden hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group">
                <div className="p-3 bg-gray-50 group-hover:bg-brand-50 transition-colors">
                  <TemplateThumbnail type={t.preview} />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.desc}</p>
                  <div className="mt-3 w-full py-2 bg-brand-700 group-hover:bg-brand-800 text-white rounded-lg text-xs font-semibold text-center transition-colors">
                    Use this template
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Audience options ──────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { value: 'none',        label: 'Manual only',            desc: 'Send only to addresses entered in To field' },
  { value: 'users',       label: 'Registered users',       desc: 'All accounts in the platform' },
  { value: 'subscribers', label: 'Newsletter subscribers', desc: 'Homepage email signups' },
  { value: 'both',        label: 'Everyone',               desc: 'Users + subscribers (deduplicated)' },
]

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminEmailPage() {
  const [tab, setTab] = useState<'compose' | 'campaigns' | 'templates' | 'log'>('compose')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)

  const [showGallery, setShowGallery] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  // Compose fields
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

  // Test send
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  // Log
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logTotal, setLogTotal] = useState(0)
  const [logPage, setLogPage] = useState(1)
  const [logPages, setLogPages] = useState(1)
  const [loadingLog, setLoadingLog] = useState(false)

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true)
    try { const res = await fetch('/api/admin/email'); if (res.ok) setCampaigns(await res.json()) }
    finally { setLoadingCampaigns(false) }
  }, [])

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/email/templates')
    if (res.ok) setTemplates(await res.json())
  }, [])

  const loadLog = useCallback(async (page = 1) => {
    setLoadingLog(true)
    try {
      const res = await fetch(`/api/admin/email?view=log&page=${page}`)
      const d = await res.json()
      setLogs(d.logs ?? [])
      setLogTotal(d.total ?? 0)
      setLogPage(d.page ?? 1)
      setLogPages(d.pages ?? 1)
    } finally { setLoadingLog(false) }
  }, [])

  useEffect(() => { loadCampaigns(); loadTemplates() }, [loadCampaigns, loadTemplates])
  useEffect(() => { if (tab === 'log') loadLog(1) }, [tab, loadLog])

  const resetForm = () => {
    setSubject(''); setHtmlBody(''); setToChips([]); setCcChips([])
    setBccChips([]); setAttachments([]); setPreview(false); setShowCcBcc(false)
    setEditorKey(k => k + 1)
  }

  const loadBaseTemplate = (subj: string, html: string) => {
    setSubject(subj); setHtmlBody(html); setEditorKey(k => k + 1)
    toast.success('Template loaded — edit the placeholders')
  }

  const buildPayload = (isDraft: boolean) => ({
    subject, htmlBody, audience, dailyLimit, sendAll,
    manualRecipients: toChips, ccRecipients: ccChips,
    bccRecipients: bccChips, attachments, isDraft,
  })

  const validate = () => {
    if (!subject.trim()) { toast.error('Subject is required'); return false }
    if (!htmlBody.trim()) { toast.error('Email body is required'); return false }
    if (audience === 'none' && toChips.length === 0) { toast.error('Add at least one recipient or choose an audience group'); return false }
    return true
  }

  const handleSaveDraft = async () => {
    if (!validate()) return
    setSavingDraft(true)
    try {
      const res = await fetch('/api/admin/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload(true)) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Save failed'); return }
      toast.success('Draft saved'); resetForm(); setTab('campaigns'); loadCampaigns()
    } catch { toast.error('Something went wrong') }
    finally { setSavingDraft(false) }
  }

  const handleSend = async () => {
    if (!validate()) return
    const audienceLabel = AUDIENCE_OPTIONS.find(a => a.value === audience)?.label ?? audience
    const summary = audience === 'none' ? `${toChips.length} manual recipient${toChips.length > 1 ? 's' : ''}` : audienceLabel + (toChips.length ? ` + ${toChips.length} manual` : '')
    if (!confirm(`Send to ${summary}? This cannot be undone.`)) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload(false)) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Send failed'); return }
      data.status === 'COMPLETED'
        ? toast.success(`Sent to all ${data.sent} recipients!`)
        : toast.success(`Sent first ${data.sent} of ${data.total}. ${data.remaining} will send tomorrow at 7am.`)
      resetForm(); setTab('campaigns'); loadCampaigns()
    } catch { toast.error('Something went wrong') }
    finally { setSending(false) }
  }

  const handleTestSend = async () => {
    if (!testEmail.trim() || !isValidEmail(testEmail)) { toast.error('Enter a valid email'); return }
    if (!validate()) return
    setTestSending(true)
    try {
      const res = await fetch('/api/admin/email/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: testEmail, subject, htmlBody }) })
      const d = await res.json()
      res.ok ? toast.success(`Test sent to ${testEmail}`) : toast.error(d.error ?? 'Test send failed')
    } catch { toast.error('Something went wrong') }
    finally { setTestSending(false) }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) { toast.error('Template name required'); return }
    if (!htmlBody.trim()) { toast.error('Write an email body first'); return }
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/admin/email/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTemplateName, subject, htmlBody }) })
      const d = await res.json()
      if (res.ok) { toast.success('Template saved'); setTemplates(p => [d, ...p]); setNewTemplateName(''); setShowSaveTemplate(false) }
      else toast.error(d.error ?? 'Save failed')
    } catch { toast.error('Something went wrong') }
    finally { setSavingTemplate(false) }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    const res = await fetch('/api/admin/email/templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) { setTemplates(p => p.filter(t => t.id !== id)); toast.success('Deleted') }
  }

  const loadTemplate = (t: Template) => {
    setSubject(t.subject); setHtmlBody(t.htmlBody); setTab('compose')
    toast.success(`Loaded "${t.name}"`)
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'SENDING')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email</h1>
          <p className="text-gray-500 mt-1">Campaigns, templates and send logs</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['compose', 'campaigns', 'templates', 'log'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'campaigns') loadCampaigns() }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'campaigns' && activeCampaigns.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{activeCampaigns.length}</span>
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Compose ── */}
      {tab === 'compose' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Email header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
              <div className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0">From</span>
                <span className="text-gray-500 text-xs">Xcel360 via Resend</span>
              </div>
              <div className="flex items-start gap-3 px-5 py-3">
                <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0 mt-2.5">To</span>
                <div className="flex-1 min-w-0">
                  <ChipInput chips={toChips} onChange={setToChips} placeholder="Type email + Enter, or paste multiple…" />
                  <div className="flex items-center gap-2 mt-2">
                    <CsvImport onImport={emails => setToChips(prev => Array.from(new Set([...prev, ...emails])))} />
                    {toChips.length > 0 && <span className="text-xs text-gray-400">{toChips.length} address{toChips.length > 1 ? 'es' : ''}</span>}
                    <button type="button" onClick={() => setShowCcBcc(v => !v)} className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      CC / BCC <ChevronDown className={`h-3 w-3 transition-transform ${showCcBcc ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              {showCcBcc && <>
                <div className="flex items-start gap-3 px-5 py-3">
                  <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0 mt-2.5">CC</span>
                  <div className="flex-1"><ChipInput chips={ccChips} onChange={setCcChips} placeholder="CC recipients…" /></div>
                </div>
                <div className="flex items-start gap-3 px-5 py-3">
                  <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0 mt-2.5">BCC</span>
                  <div className="flex-1"><ChipInput chips={bccChips} onChange={setBccChips} placeholder="BCC recipients…" /></div>
                </div>
              </>}
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="w-8 text-right text-xs font-semibold text-gray-400 shrink-0">Subj</span>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line…"
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent" />
              </div>
            </div>

            {/* Editor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Message</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowGallery(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors">
                    <Layers className="h-3.5 w-3.5" /> Templates
                  </button>
                  <button onClick={() => setPreview(v => !v)} className="text-xs text-brand-700 font-medium hover:text-brand-800">
                    {preview ? 'Edit' : 'Preview'}
                  </button>
                </div>
              </div>
              {preview
                ? <div className="min-h-[280px] border border-gray-200 rounded-xl p-4 overflow-auto text-sm" dangerouslySetInnerHTML={{ __html: htmlBody }} />
                : <RichTextEditor key={editorKey} value={htmlBody} onChange={setHtmlBody} />
              }
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Attachments</p>
              <AttachmentUploader attachments={attachments} onAdd={a => setAttachments(p => [...p, a])} onRemove={url => setAttachments(p => p.filter(a => a.url !== url))} />
            </div>

            {/* Test send */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FlaskConical className="h-4 w-4 text-amber-500" /> Test Send</p>
              <div className="flex gap-2">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button onClick={handleTestSend} disabled={testSending || !testEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap">
                  {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                  Send Test
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Sends to you only with a [TEST] prefix — not logged as a campaign.</p>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Templates quick load */}
            {templates.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-brand-600" /> Load Template</p>
                <div className="space-y-1.5">
                  {templates.slice(0, 5).map(t => (
                    <button key={t.id} onClick={() => loadTemplate(t)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-50 rounded-lg transition-colors text-sm text-gray-700 hover:text-brand-700">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate flex-1">{t.name}</span>
                    </button>
                  ))}
                  {templates.length > 5 && <button onClick={() => setTab('templates')} className="text-xs text-brand-700 font-medium pl-3">View all {templates.length} →</button>}
                </div>
              </div>
            )}

            {/* Audience */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Audience group</label>
              <div className="space-y-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${audience === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="audience" value={opt.value} checked={audience === opt.value} onChange={() => setAudience(opt.value)} className="mt-0.5 text-brand-600" />
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
                <input type="checkbox" checked={sendAll} onChange={e => setSendAll(e.target.checked)} className="w-4 h-4 rounded text-brand-600" />
                <span className="text-sm text-gray-700">Send all at once</span>
              </label>
              {!sendAll && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Daily limit <span className="text-gray-400">(max 100 free plan)</span></label>
                  <input type="number" min={1} max={100} value={dailyLimit} onChange={e => setDailyLimit(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <p className="text-xs text-gray-400 mt-1.5">Remaining emails continue at 7am each day.</p>
                </div>
              )}
              {sendAll && <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">Free plan limit is 100/day. Remaining will continue via daily cron.</p>}
            </div>

            {/* Save template */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              {!showSaveTemplate
                ? <button onClick={() => setShowSaveTemplate(true)} className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-200 text-gray-500 rounded-xl text-sm hover:border-brand-300 hover:text-brand-700 transition-colors">
                    <Save className="h-4 w-4" /> Save as Template
                  </button>
                : <div className="space-y-2">
                    <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Template name…"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveTemplate} disabled={savingTemplate}
                        className="flex-1 py-2 bg-brand-700 text-white rounded-lg text-xs font-semibold hover:bg-brand-800 disabled:opacity-50">
                        {savingTemplate ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => { setShowSaveTemplate(false); setNewTemplateName('') }} className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
              }
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={handleSend} disabled={sending || savingDraft || !subject.trim() || !htmlBody.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-700 text-white rounded-xl font-semibold hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send Campaign'}
              </button>
              <button onClick={handleSaveDraft} disabled={sending || savingDraft || !subject.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingDraft ? 'Saving…' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Campaigns ── */}
      {tab === 'campaigns' && (
        <div className="space-y-6">
          {activeCampaigns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active</h2>
                <button onClick={loadCampaigns} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Refresh</button>
              </div>
              <div className="space-y-3">{activeCampaigns.map(c => <CampaignCard key={c.id} campaign={c} onAction={loadCampaigns} />)}</div>
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{activeCampaigns.length > 0 ? 'History' : 'All Campaigns'}</h2>
            {loadingCampaigns
              ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
              : campaigns.filter(c => c.status !== 'SENDING').length === 0 && activeCampaigns.length === 0
              ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Mail className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500 font-medium">No campaigns yet</p>
                  <button onClick={() => setTab('compose')} className="mt-4 text-brand-700 text-sm font-medium">Compose now →</button>
                </div>
              : <div className="space-y-3">{campaigns.filter(c => c.status !== 'SENDING').map(c => <CampaignCard key={c.id} campaign={c} onAction={loadCampaigns} />)}</div>
            }
          </div>
        </div>
      )}

      {/* ── Templates ── */}
      {tab === 'templates' && (
        <div className="space-y-8">
          {/* Built-in starter templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Starter Templates</h2>
                <p className="text-xs text-gray-400 mt-0.5">Pre-designed layouts — click to load into Compose</p>
              </div>
              <button onClick={() => setTab('compose')} className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors">
                <Mail className="h-4 w-4" /> New Email
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BASE_TEMPLATES.map(t => (
                <div key={t.name}
                  onClick={() => { loadBaseTemplate(t.subject, t.html); setTab('compose') }}
                  className="border border-gray-100 rounded-2xl overflow-hidden hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="p-3 bg-gray-50 group-hover:bg-brand-50 transition-colors">
                    <TemplateThumbnail type={t.preview} />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.desc}</p>
                    <div className="mt-3 w-full py-2 bg-brand-700 group-hover:bg-brand-800 text-white rounded-lg text-xs font-semibold text-center transition-colors">
                      Use this template
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved templates */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Saved Templates <span className="text-gray-400 font-normal normal-case ml-1">({templates.length})</span>
            </h2>
            {templates.length === 0
              ? <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <BookOpen className="h-8 w-8 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No saved templates yet</p>
                  <p className="text-xs text-gray-400 mt-1">Compose an email and click "Save as Template".</p>
                </div>
              : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{t.subject || 'No subject'}</p>
                        <p className="text-xs text-gray-300 mt-1">{new Date(t.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <button onClick={() => loadTemplate(t)}
                          className="flex-1 py-2 bg-brand-700 text-white rounded-lg text-xs font-semibold hover:bg-brand-800 transition-colors">
                          Use Template
                        </button>
                        <button onClick={() => handleDeleteTemplate(t.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── Log ── */}
      {tab === 'log' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{logTotal.toLocaleString()} total log entries</p>
            <button onClick={() => loadLog(logPage)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Refresh</button>
          </div>
          {loadingLog
            ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
            : logs.length === 0
            ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Mail className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No log entries yet</p>
                <p className="text-sm text-gray-400 mt-1">Logs are created when emails are sent.</p>
              </div>
            : <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Recipient</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Campaign</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Sent at</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {logs.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 font-medium">{l.to}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell font-mono">{l.campaignId.slice(-8)}</td>
                          <td className="px-4 py-3">
                            {l.status === 'SENT'
                              ? <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium"><CheckCircle className="h-3 w-3" /> Sent</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium" title={l.error ?? ''}><AlertCircle className="h-3 w-3" /> Failed</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{new Date(l.sentAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logPages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-sm text-gray-500">Page {logPage} of {logPages}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { const p = Math.max(1, logPage - 1); setLogPage(p); loadLog(p) }} disabled={logPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </button>
                      <button onClick={() => { const p = Math.min(logPages, logPage + 1); setLogPage(p); loadLog(p) }} disabled={logPage === logPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
          }
        </div>
      )}

      {showGallery && (
        <TemplateGallery
          onSelect={loadBaseTemplate}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  )
}
