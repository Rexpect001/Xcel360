'use client'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BadgeCheck, Loader2, Download, FileSpreadsheet, RefreshCw, Ban,
  ExternalLink, Search, Settings2, Sparkles, CheckCircle2, ChevronDown,
} from 'lucide-react'

interface EventItem {
  id: string
  title: string
  date: string
  type: string
  registrationCount: number
  certificateCount: number
}

interface CertInfo {
  id: string
  certificateId: string
  status: 'ISSUED' | 'REVOKED'
  pdfUrl: string | null
  certificateType: string
  issuedAt: string
  emailSentAt: string | null
}

interface Participant {
  registrationId: string
  fullName: string
  email: string
  phone: string | null
  institution: string | null
  course: string | null
  registeredAt: string
  certificate: CertInfo | null
}

interface Template {
  certificateType?: string
  backgroundUrl?: string | null
  logoUrl?: string | null
  signatureUrl?: string | null
  signatureName?: string | null
  signatureTitle?: string | null
  bodyText?: string | null
}

type StatusFilter = 'all' | 'issued' | 'pending' | 'revoked'

export default function AdminCertificatesPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventId, setEventId] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [stats, setStats] = useState({ total: 0, issued: 0, revoked: 0 })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [generating, setGenerating] = useState(false)
  const [busyRow, setBusyRow] = useState<string | null>(null)
  const [showTemplate, setShowTemplate] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true) // email participants on generate

  // Load events on mount
  useEffect(() => {
    fetch('/api/admin/certificates/events')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.events)) setEvents(d.events) })
      .catch(() => toast.error('Failed to load events'))
  }, [])

  const loadParticipants = (id: string) => {
    if (!id) return
    setLoading(true)
    setSelected(new Set())
    fetch(`/api/admin/certificates?eventId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setParticipants(Array.isArray(d.participants) ? d.participants : [])
        if (d.stats) setStats(d.stats)
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load participants'); setLoading(false) })
  }

  useEffect(() => { if (eventId) loadParticipants(eventId) }, [eventId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return participants.filter((p) => {
      if (q && !`${p.fullName} ${p.email} ${p.institution ?? ''} ${p.course ?? ''}`.toLowerCase().includes(q)) {
        return false
      }
      if (statusFilter === 'issued') return p.certificate?.status === 'ISSUED'
      if (statusFilter === 'revoked') return p.certificate?.status === 'REVOKED'
      if (statusFilter === 'pending') return !p.certificate
      return true
    })
  }, [participants, search, statusFilter])

  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.registrationId))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allVisibleSelected) filtered.forEach((p) => next.delete(p.registrationId))
    else filtered.forEach((p) => next.add(p.registrationId))
    setSelected(next)
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const generate = async (regenerate = false) => {
    const ids = Array.from(selected)
    if (ids.length === 0) { toast.error('Select at least one participant'); return }
    setGenerating(true)
    const t = toast.loading(`${regenerate ? 'Regenerating' : 'Generating'} ${ids.length} certificate(s)…`)
    try {
      const res = await fetch('/api/admin/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, registrationIds: ids, regenerate, sendEmail: notifyEmail }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast.success(`${d.generated} generated · ${d.skipped} skipped · ${d.failed} failed`, { id: t })
      if (d.errors?.length) console.warn('Certificate errors:', d.errors)
      loadParticipants(eventId)
    } catch (e: any) {
      toast.error(e.message || 'Generation failed', { id: t })
    } finally {
      setGenerating(false)
    }
  }

  const regenerateOne = async (registrationId: string) => {
    setBusyRow(registrationId)
    const t = toast.loading('Regenerating…')
    try {
      const res = await fetch('/api/admin/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, registrationIds: [registrationId], regenerate: true, sendEmail: notifyEmail }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast.success('Certificate regenerated', { id: t })
      loadParticipants(eventId)
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: t })
    } finally {
      setBusyRow(null)
    }
  }

  const setRevoked = async (cert: CertInfo, revoke: boolean) => {
    setBusyRow(cert.id)
    const t = toast.loading(revoke ? 'Revoking…' : 'Reinstating…')
    try {
      const res = await fetch('/api/admin/certificates/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cert.id, revoke }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast.success(revoke ? 'Certificate revoked' : 'Certificate reinstated', { id: t })
      loadParticipants(eventId)
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: t })
    } finally {
      setBusyRow(null)
    }
  }

  const selectedEvent = events.find((e) => e.id === eventId)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
          <BadgeCheck className="h-5 w-5 text-brand-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-500 text-sm">Generate and manage participant certificates</p>
        </div>
      </div>

      {/* Event selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Select Event
        </label>
        <div className="relative">
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          >
            <option value="">— Choose an event —</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {`  (${e.registrationCount} registered, ${e.certificateCount} issued)`}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {!eventId ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <BadgeCheck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Select an event to view registered participants.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <StatCard label="Registered" value={stats.total} />
            <StatCard label="Issued" value={stats.issued} tone="green" />
            <StatCard label="Revoked" value={stats.revoked} tone="red" />
          </div>

          {/* Template settings */}
          <TemplatePanel
            eventId={eventId}
            open={showTemplate}
            onToggle={() => setShowTemplate((v) => !v)}
          />

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name, email, institution…"
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(['all', 'pending', 'issued', 'revoked'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    statusFilter === s ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => window.open(`/api/admin/certificates/export?eventId=${eventId}`, '_blank')}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export
            </button>
            <button
              onClick={() => window.open(`/api/admin/certificates/download-all?eventId=${eventId}`, '_blank')}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" /> Download All
            </button>
          </div>

          {/* Selection action bar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="rounded border-gray-300 text-brand-700 focus:ring-brand-500" />
              {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
            </label>
            <div className="flex items-center gap-3">
              <label
                className="flex items-center gap-2 text-sm cursor-pointer select-none"
                title="When off, certificates are created silently — no email is sent to participants"
              >
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
                />
                <span className={notifyEmail ? 'text-gray-600' : 'text-amber-600 font-medium'}>
                  {notifyEmail ? 'Email participants' : "Don't email"}
                </span>
              </label>
              <div className="w-px h-5 bg-gray-200" />
              <button
                onClick={() => generate(true)}
                disabled={generating || selected.size === 0}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </button>
              <button
                onClick={() => generate(false)}
                disabled={generating || selected.size === 0}
                className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-40"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Certificates
              </button>
            </div>
          </div>

          {/* Participant list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
              No participants match this filter.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {filtered.map((p) => {
                const cert = p.certificate
                const isBusy = busyRow === p.registrationId || (cert && busyRow === cert.id)
                return (
                  <div key={p.registrationId} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(p.registrationId)}
                      onChange={() => toggleOne(p.registrationId)}
                      className="rounded border-gray-300 text-brand-700 focus:ring-brand-500 shrink-0"
                    />
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-brand-700 font-bold text-sm">{p.fullName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.email}
                        {p.institution ? ` · ${p.institution}` : ''}
                        {p.course ? ` · ${p.course}` : ''}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {!cert ? (
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Not issued</span>
                      ) : cert.status === 'REVOKED' ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Revoked</span>
                      ) : (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {cert.certificateId}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isBusy && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                      {cert?.pdfUrl && (
                        <a href={cert.pdfUrl} target="_blank" rel="noreferrer" title="View PDF"
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-700 transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {cert && (
                        <button onClick={() => regenerateOne(p.registrationId)} disabled={!!isBusy} title="Regenerate"
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-700 transition-colors disabled:opacity-40">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      {cert && (
                        cert.status === 'ISSUED' ? (
                          <button onClick={() => setRevoked(cert, true)} disabled={!!isBusy} title="Revoke"
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40">
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => setRevoked(cert, false)} disabled={!!isBusy} title="Reinstate"
                            className="p-2 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-40">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {selectedEvent && (
            <p className="text-xs text-gray-400 mt-3 px-1">
              Certificates remain linked to the original registration &amp; event records. Generating again skips
              participants who already have one — use Regenerate to refresh a PDF.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-green-700' : tone === 'red' ? 'text-red-600' : 'text-gray-900'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function TemplatePanel({ eventId, open, onToggle }: { eventId: string; open: boolean; onToggle: () => void }) {
  const [tpl, setTpl] = useState<Template>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    if (!open || loaded) return
    fetch(`/api/admin/certificates/template?eventId=${eventId}`)
      .then((r) => r.json())
      .then((d) => { setTpl(d.template ?? {}); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [open, loaded, eventId])

  const upload = async (kind: 'background' | 'logo' | 'signature', file: File) => {
    setUploading(kind)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    try {
      const res = await fetch('/api/admin/certificates/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Upload failed')
      setTpl((t) => ({ ...t, [`${kind}Url`]: d.url }))
      toast.success(`${kind} uploaded`)
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const save = async () => {
    setSaving(true)
    const t = toast.loading('Saving template…')
    try {
      const res = await fetch('/api/admin/certificates/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...tpl }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success('Template saved', { id: t })
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: t })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <Settings2 className="h-5 w-5 text-brand-700" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Certificate Design</p>
          <p className="text-xs text-gray-500">Background, logo, signature &amp; text for this event</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-50 p-5 space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <AssetUpload label="Background" kind="background" url={tpl.backgroundUrl} uploading={uploading} onUpload={upload} />
            <AssetUpload label="Logo" kind="logo" url={tpl.logoUrl} uploading={uploading} onUpload={upload} />
            <AssetUpload label="Signature" kind="signature" url={tpl.signatureUrl} uploading={uploading} onUpload={upload} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Certificate Type">
              <input value={tpl.certificateType ?? ''} onChange={(e) => setTpl({ ...tpl, certificateType: e.target.value })}
                placeholder="Certificate of Participation"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            </Field>
            <Field label="Signature Name">
              <input value={tpl.signatureName ?? ''} onChange={(e) => setTpl({ ...tpl, signatureName: e.target.value })}
                placeholder="Dr. Jane Doe"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            </Field>
            <Field label="Signature Title">
              <input value={tpl.signatureTitle ?? ''} onChange={(e) => setTpl({ ...tpl, signatureTitle: e.target.value })}
                placeholder="Program Director"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            </Field>
          </div>

          <Field label="Body Text (optional)">
            <textarea value={tpl.bodyText ?? ''} onChange={(e) => setTpl({ ...tpl, bodyText: e.target.value })}
              rows={3} placeholder="for active participation in {{EVENT_NAME}}, held on {{EVENT_DATE}}."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
            <p className="text-xs text-gray-400 mt-1">
              Placeholders: {'{{FULL_NAME}} {{EVENT_NAME}} {{EVENT_DATE}} {{CERTIFICATE_ID}} {{ISSUE_DATE}}'}
            </p>
          </Field>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Design
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AssetUpload({
  label, kind, url, uploading, onUpload,
}: {
  label: string
  kind: 'background' | 'logo' | 'signature'
  url?: string | null
  uploading: string | null
  onUpload: (kind: 'background' | 'logo' | 'signature', file: File) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
      <label className="block border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:border-brand-400 transition-colors">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-16 mx-auto object-contain" />
        ) : (
          <span className="text-xs text-gray-400 block py-5">
            {uploading === kind ? 'Uploading…' : 'Click to upload PNG/JPG'}
          </span>
        )}
        <input type="file" accept="image/png,image/jpeg" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(kind, f) }} />
      </label>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}
