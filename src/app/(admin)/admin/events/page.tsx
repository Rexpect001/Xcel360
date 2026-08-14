'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Calendar, Users, FileText, X, GripVertical, Clock, User, ChevronRight, Loader2, CheckSquare2, ImageIcon, Upload } from 'lucide-react'
import { Event } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'
import { useRef } from 'react'

const emptyForm = {
  title: '',
  description: '',
  type: 'Zoom',
  date: '',
  host: '',
  link: '',
  meetingDetails: '',
  coverImage: '',
  published: false,
}

interface Question {
  id?: string
  label: string
  type: string
  options: string[]
  required: boolean
  _optionsText?: string // local textarea state for options
}

const emptyQuestion = (): Question => ({
  label: '',
  type: 'text',
  options: [],
  required: false,
  _optionsText: '',
})

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  // Event form modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Questions modal
  const [qModalOpen, setQModalOpen] = useState(false)
  const [qEventId, setQEventId] = useState<string | null>(null)
  const [qEventTitle, setQEventTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qSaving, setQSaving] = useState(false)

  // Flyer upload
  const [uploading, setUploading] = useState(false)
  const flyerInputRef = useRef<HTMLInputElement>(null)

  const handleFlyerUpload = async (file: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/events/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Upload failed'); return }
      setForm((f) => ({ ...f, coverImage: data.url }))
      toast.success('Flyer uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelected(p => p.size === events.length ? new Set() : new Set(events.map(e => e.id)))
  const bulkAction = async (action: string) => {
    const ids = Array.from(selected)
    if (action === 'delete' && !confirm(`Delete ${ids.length} event(s) and all their registrations?`)) return
    const res = await fetch('/api/admin/events/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, action }) })
    if (res.ok) {
      if (action === 'delete') setEvents(p => p.filter(e => !selected.has(e.id)))
      else setEvents(p => p.map(e => selected.has(e.id) ? { ...e, published: action === 'publish' } : e))
      setSelected(new Set())
      toast.success(`Done  -  ${ids.length} event(s) updated`)
    } else toast.error('Action failed')
  }

  // Detail modal
  const [detailEvent, setDetailEvent] = useState<any | null>(null)
  const [detailData, setDetailData] = useState<{ registrations: any[]; questions: any[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/events')
      .then((r) => r.json())
      .then((d) => { setEvents(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  // ── Event CRUD ──

  const openAdd = () => {
    setEditEvent(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (e: Event) => {
    setEditEvent(e)
    setForm({
      title: e.title,
      description: e.description ?? '',
      type: e.type,
      date: new Date(e.date).toISOString().slice(0, 16),
      host: e.host ?? '',
      link: (e as any).link ?? '',
      meetingDetails: (e as any).meetingDetails ?? '',
      coverImage: (e as any).coverImage ?? '',
      published: e.published,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error('Title and date are required'); return }
    setSaving(true)
    const body = { ...form, date: new Date(form.date).toISOString() }
    const url = editEvent ? `/api/admin/events/${editEvent.id}` : '/api/admin/events'
    const method = editEvent ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editEvent) setEvents((p) => p.map((e) => (e.id === updated.id ? updated : e)))
      else setEvents((p) => [updated, ...p])
      toast.success(editEvent ? 'Updated!' : 'Created!')
      setModalOpen(false)
    } else {
      toast.error('Error saving event')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event and all its registrations?')) return
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents((p) => p.filter((e) => e.id !== id))
      toast.success('Deleted')
    }
  }

  // ── Detail modal ──

  const openDetail = async (event: any) => {
    setDetailEvent(event)
    setDetailData(null)
    setDetailLoading(true)
    const res = await fetch(`/api/admin/events/${event.id}/registrations`)
    if (res.ok) {
      const data = await res.json()
      setDetailData({ registrations: data.registrations ?? [], questions: data.questions ?? [] })
    }
    setDetailLoading(false)
  }

  // ── Questions modal ──

  const openQuestions = async (event: Event) => {
    setQEventId(event.id)
    setQEventTitle(event.title)
    setQModalOpen(true)
    setQuestions([])
    const res = await fetch(`/api/admin/events/${event.id}/questions`)
    if (res.ok) {
      const data = await res.json()
      setQuestions(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((q: any) => ({ ...q, _optionsText: q.options?.join('\n') ?? '' }))
      )
    }
  }

  const addQuestion = () => setQuestions((p) => [...p, emptyQuestion()])

  const removeQuestion = (i: number) => setQuestions((p) => p.filter((_, idx) => idx !== i))

  const updateQuestion = (i: number, patch: Partial<Question>) =>
    setQuestions((p) => p.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))

  const saveQuestions = async () => {
    if (!qEventId) return
    setQSaving(true)
    const payload = questions
      .filter((q) => q.label.trim())
      .map((q, i) => ({
        label: q.label.trim(),
        type: q.type,
        options: q.type === 'select'
          ? (q._optionsText ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        required: q.required,
        sortOrder: i,
      }))

    const res = await fetch(`/api/admin/events/${qEventId}/questions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      toast.success('Questions saved!')
      setQModalOpen(false)
    } else {
      toast.error('Error saving questions')
    }
    setQSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">{events.length} events</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-brand-700 text-white px-5 py-3 rounded-2xl shadow-lg">
          <CheckSquare2 className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold flex-1">{selected.size} selected</span>
          <button onClick={() => bulkAction('publish')} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors">Publish</button>
          <button onClick={() => bulkAction('unpublish')} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors">Unpublish</button>
          <button onClick={() => bulkAction('delete')} className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors">Delete</button>
          <button onClick={() => setSelected(new Set())} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No events yet. Add your first event.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === events.length && events.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-brand-600 border-gray-300 cursor-pointer" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map((event) => (
                <tr key={event.id} className={`hover:bg-gray-50 transition-colors ${selected.has(event.id) ? 'bg-brand-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(event.id)} onChange={() => toggleSelect(event.id)} className="w-4 h-4 rounded text-brand-600 border-gray-300 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(event)} className="text-left group">
                      <div className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">{event.title}</div>
                      {event.host && <div className="text-xs text-gray-500">{event.host}</div>}
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(event as any)._count?.registrations > 0 && (
                        <div className="text-xs text-brand-600 mt-0.5">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(event as any)._count.registrations} registered
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{formatDate(event.date)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                      {event.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/events/${event.id}/registrations`}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                        title="View registrations"
                      >
                        <Users className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => openQuestions(event)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                        title="Manage registration questions"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(event)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        title="Edit event"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailEvent && (
        <Modal open={!!detailEvent} onClose={() => setDetailEvent(null)} title="Event Overview" size="lg">
          <div className="space-y-6">

            {/* Event header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">{detailEvent.type}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${detailEvent.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {detailEvent.published ? 'Published' : 'Draft'}
                </span>
                {new Date(detailEvent.date) < new Date() && (
                  <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Past</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-snug">{detailEvent.title}</h2>
              {detailEvent.description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{detailEvent.description}</p>
              )}
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(detailEvent.date)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Time</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(detailEvent.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {detailEvent.host && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Host</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{detailEvent.host}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold text-brand-700">
                  {detailLoading ? <Loader2 className="h-7 w-7 animate-spin mx-auto text-brand-400" /> : (detailData?.registrations.length ?? 0)}
                </p>
                <p className="text-sm text-brand-600 mt-1 font-medium">Registered</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold text-purple-700">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(detailEvent as any)._count?.questions ?? detailData?.questions.length ?? 0}
                </p>
                <p className="text-sm text-purple-600 mt-1 font-medium">Custom Questions</p>
              </div>
            </div>

            {/* Recent registrants */}
            {!detailLoading && detailData && detailData.registrations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Recent Registrations
                </p>
                <div className="space-y-2">
                  {detailData.registrations.slice(0, 5).map((reg: any) => (
                    <div key={reg.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-brand-700 font-bold text-xs">{reg.fullName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{reg.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{reg.email}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">
                        {new Date(reg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
                {detailData.registrations.length > 5 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    +{detailData.registrations.length - 5} more registrations
                  </p>
                )}
              </div>
            )}

            {!detailLoading && detailData?.registrations.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No registrations yet for this event.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Link
                href={`/admin/events/${detailEvent.id}/registrations`}
                onClick={() => setDetailEvent(null)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors"
              >
                <Users className="h-4 w-4" /> View All Registrations <ChevronRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => { setDetailEvent(null); openEdit(detailEvent) }}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Event Form Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editEvent ? 'Edit Event' : 'Add Event'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Event title"
            />
          </div>

          {/* Flyer upload  -  first so it's always visible */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event Flyer / Cover Image</label>
            <input
              ref={flyerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFlyerUpload(f) }}
            />
            {form.coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="Event flyer preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverImage: '' }))}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  title="Remove flyer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => flyerInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors flex flex-col items-center gap-2 disabled:opacity-60"
              >
                {uploading ? (
                  <><Loader2 className="h-6 w-6 animate-spin text-brand-500" /><span>Uploading…</span></>
                ) : (
                  <><Upload className="h-5 w-5 text-gray-300" /><span>Click to upload flyer <span className="text-gray-400 text-xs">(JPG, PNG, WebP  -  max 5 MB)</span></span></>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {['Zoom', 'In-person', 'Webinar', 'Workshop', 'Q&A', 'Info Session'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Host</label>
            <input
              value={form.host}
              onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Host name or organization"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event Link (Zoom / Registration URL)</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="https://zoom.us/j/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meeting / Joining Details</label>
            <textarea
              rows={4}
              value={form.meetingDetails}
              onChange={(e) => setForm((f) => ({ ...f, meetingDetails: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder={"Zoom link, Meeting ID, Passcode, dial-in numbers…\nThis is emailed to anyone who registers."}
            />
            <p className="text-xs text-gray-400 mt-1">Included automatically in the registration confirmation email. Links are clickable.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="What is this event about?"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 rounded text-brand-600 border-gray-300"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">Publish immediately</label>
          </div>
          {editEvent && (
            <p className="text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
              To add custom registration questions, save the event then click the <FileText className="inline h-3 w-3" /> icon in the table.
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : editEvent ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Questions Modal ── */}
      <Modal open={qModalOpen} onClose={() => setQModalOpen(false)} title={`Registration Questions`}>
        <div className="space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            <strong className="text-gray-700">{qEventTitle}</strong>  -  These questions appear on the registration form in addition to Name, Email, and Phone.
          </p>

          {questions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No custom questions yet. Add one below.</p>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300 mt-2.5 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={q.label}
                        onChange={(e) => updateQuestion(i, { label: e.target.value })}
                        placeholder="Question text, e.g. Year of Study"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(i, { type: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>
                    {q.type === 'select' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Options (one per line)</label>
                        <textarea
                          rows={3}
                          value={q._optionsText}
                          onChange={(e) => updateQuestion(i, { _optionsText: e.target.value })}
                          placeholder="100 Level&#10;200 Level&#10;300 Level&#10;400 Level"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`req-${i}`}
                        checked={q.required}
                        onChange={(e) => updateQuestion(i, { required: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-brand-600"
                      />
                      <label htmlFor={`req-${i}`} className="text-xs text-gray-600">Required</label>
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors mt-1 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addQuestion}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>

          <div className="flex gap-3">
            <button onClick={() => setQModalOpen(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={saveQuestions} disabled={qSaving} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-colors">
              {qSaving ? 'Saving...' : 'Save Questions'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
