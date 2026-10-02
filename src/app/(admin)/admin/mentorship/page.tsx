'use client'
import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight,
  ExternalLink, CheckSquare, Square, Calendar, X, Linkedin,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

const emptyForm = {
  mentor: '',
  title: '',
  description: '',
  expertise: '',
  link: '',
  linkedIn: '',
  available: true,
}

export default function AdminMentorshipPage() {
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editMentor, setEditMentor] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Detail modal
  const [detailMentor, setDetailMentor] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/mentorship')
      .then((r) => r.json())
      .then((d) => { setMentors(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  // ── Add / Edit ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditMentor(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (m: any) => {
    setDetailOpen(false)
    setEditMentor(m)
    setForm({
      mentor: m.mentor,
      title: m.title,
      description: m.description ?? '',
      expertise: (m.expertise ?? []).join(', '),
      link: m.link ?? '',
      linkedIn: m.linkedIn ?? '',
      available: m.available,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.mentor || !form.title) {
      toast.error('Mentor name and title are required')
      return
    }
    setSaving(true)
    const body = {
      ...form,
      expertise: form.expertise.split(',').map((t) => t.trim()).filter(Boolean),
      link: form.link || null,
      linkedIn: form.linkedIn || null,
    }
    const url = editMentor ? `/api/admin/mentorship/${editMentor.id}` : '/api/admin/mentorship'
    const method = editMentor ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editMentor) setMentors((p) => p.map((x) => (x.id === updated.id ? updated : x)))
      else setMentors((p) => [updated, ...p])
      toast.success(editMentor ? 'Updated!' : 'Created!')
      setModalOpen(false)
    } else {
      toast.error('Error saving')
    }
    setSaving(false)
  }

  // ── Single delete ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mentor?')) return
    const res = await fetch(`/api/admin/mentorship/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMentors((p) => p.filter((x) => x.id !== id))
      setDetailOpen(false)
      toast.success('Deleted')
    }
  }

  // ── Availability toggle ──────────────────────────────────────────────────
  const toggleAvailable = async (m: any) => {
    const res = await fetch(`/api/admin/mentorship/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !m.available }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMentors((p) => p.map((x) => (x.id === updated.id ? updated : x)))
      // keep detail modal in sync
      if (detailMentor?.id === updated.id) setDetailMentor(updated)
    }
  }

  // ── Detail modal ──────────────────────────────────────────────────────────
  const openDetail = (m: any) => {
    setDetailMentor(m)
    setDetailOpen(true)
  }

  // ── Bulk select helpers ───────────────────────────────────────────────────
  const filtered = mentors.filter(
    (m) =>
      m.mentor?.toLowerCase().includes(search.toLowerCase()) ||
      m.title?.toLowerCase().includes(search.toLowerCase()),
  )

  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id))
  const someSelected = filtered.some((m) => selected.has(m.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((m) => next.delete(m.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((m) => next.add(m.id))
        return next
      })
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const bulkAction = async (action: 'available' | 'unavailable' | 'delete') => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (action === 'delete' && !confirm(`Delete ${ids.length} mentor(s)? This cannot be undone.`)) return

    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/mentorship/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids }),
      })
      if (!res.ok) throw new Error('Request failed')

      if (action === 'delete') {
        setMentors((p) => p.filter((m) => !ids.includes(m.id)))
        toast.success(`Deleted ${ids.length} mentor(s)`)
      } else {
        const isAvailable = action === 'available'
        setMentors((p) =>
          p.map((m) => (ids.includes(m.id) ? { ...m, available: isAvailable } : m)),
        )
        toast.success(
          `Marked ${ids.length} mentor(s) as ${isAvailable ? 'available' : 'unavailable'}`,
        )
      }
      setSelected(new Set())
    } catch {
      toast.error('Bulk action failed')
    }
    setBulkLoading(false)
  }

  const selectedCount = selected.size

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Mentorship</h1>
          <p className="text-gray-500 mt-1">{mentors.length} mentors</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Mentor
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mentors..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-brand-700 transition-colors"
                    title={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-700" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mentor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Expertise</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No mentors found
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-gray-50 transition-colors ${selected.has(m.id) ? 'bg-brand-50' : ''}`}
                  >
                    {/* Row checkbox */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(m.id)}
                        className="text-gray-400 hover:text-brand-700 transition-colors"
                      >
                        {selected.has(m.id) ? (
                          <CheckSquare className="h-4 w-4 text-brand-700" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Mentor name  -  clickable */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(m)}
                        className="text-left group"
                      >
                        <div className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">
                          {m.mentor}
                        </div>
                        <div className="text-xs text-gray-500">{m.title}</div>
                      </button>
                    </td>

                    {/* Expertise */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(m.expertise ?? []).slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {m.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleAvailable(m)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.available
                              ? 'text-green-500 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title="Toggle availability"
                        >
                          {m.available ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Floating bulk action bar ───────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <div className="w-px h-5 bg-gray-600" />
          <button
            onClick={() => bulkAction('available')}
            disabled={bulkLoading}
            className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
          >
            Mark Available
          </button>
          <button
            onClick={() => bulkAction('unavailable')}
            disabled={bulkLoading}
            className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50"
          >
            Mark Unavailable
          </button>
          <button
            onClick={() => bulkAction('delete')}
            disabled={bulkLoading}
            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-1 p-1 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Mentor Details"
        size="lg"
      >
        {detailMentor && (
          <div className="space-y-5">
            {/* Name + title */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{detailMentor.mentor}</h3>
              <p className="text-sm text-brand-700 font-medium mt-0.5">{detailMentor.title}</p>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  detailMentor.available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {detailMentor.available ? 'Available' : 'Unavailable'}
              </span>
            </div>

            {/* Description */}
            {detailMentor.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  About
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{detailMentor.description}</p>
              </div>
            )}

            {/* Expertise badges */}
            {(detailMentor.expertise ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Expertise
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(detailMentor.expertise ?? []).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* LinkedIn */}
            {detailMentor.linkedIn && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">LinkedIn</p>
                <a
                  href={detailMentor.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0077b5] hover:text-[#005885] transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  View LinkedIn Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Booking link */}
            {detailMentor.link && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Booking Link
                </p>
                <a
                  href={detailMentor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 underline underline-offset-2 transition-colors"
                >
                  {detailMentor.link}
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Created date */}
            {detailMentor.createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                Added{' '}
                {new Date(detailMentor.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => openEdit(detailMentor)}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => handleDelete(detailMentor.id)}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                onClick={() => setDetailOpen(false)}
                className="ml-auto px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMentor ? 'Edit Mentor' : 'Add Mentor'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mentor Name *</label>
              <input
                value={form.mentor}
                onChange={(e) => setForm((f) => ({ ...f, mentor: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Dr. Sarah Johnson"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title / Offering *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="PhD Application Strategy"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Brief bio and what this mentor offers..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Expertise <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              value={form.expertise}
              onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="PhD, STEM, US Universities"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              LinkedIn Profile <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0077b5]" />
              <input
                value={form.linkedIn}
                onChange={(e) => setForm((f) => ({ ...f, linkedIn: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Booking Link <span className="text-gray-400">(optional  -  Calendly, etc.)</span>
            </label>
            <input
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="https://calendly.com/..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
              className="w-4 h-4 rounded text-brand-600 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Available for bookings</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving...' : editMentor ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
