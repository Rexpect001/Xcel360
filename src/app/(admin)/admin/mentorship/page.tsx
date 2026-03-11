'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

const emptyForm = {
  mentor: '',
  title: '',
  description: '',
  expertise: '',
  link: '',
  available: true,
}

export default function AdminMentorshipPage() {
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editMentor, setEditMentor] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/mentorship')
      .then((r) => r.json())
      .then((d) => { setMentors(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const openAdd = () => {
    setEditMentor(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (m: any) => {
    setEditMentor(m)
    setForm({
      mentor: m.mentor,
      title: m.title,
      description: m.description ?? '',
      expertise: (m.expertise ?? []).join(', '),
      link: m.link ?? '',
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mentor?')) return
    const res = await fetch(`/api/admin/mentorship/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMentors((p) => p.filter((x) => x.id !== id))
      toast.success('Deleted')
    }
  }

  const toggleAvailable = async (m: any) => {
    const res = await fetch(`/api/admin/mentorship/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !m.available }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMentors((p) => p.map((x) => (x.id === updated.id ? updated : x)))
    }
  }

  const filtered = mentors.filter(
    (m) => m.mentor?.toLowerCase().includes(search.toLowerCase()) ||
           m.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-500 mt-1">{mentors.length} mentors</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors">
          <Plus className="h-4 w-4" /> Add Mentor
        </button>
      </div>

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
          <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mentor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Expertise</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-sm">No mentors found</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{m.mentor}</div>
                      <div className="text-xs text-gray-500">{m.title}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(m.expertise ?? []).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleAvailable(m)} className={`p-1.5 rounded-lg transition-colors ${m.available ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title="Toggle availability">
                          {m.available ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editMentor ? 'Edit Mentor' : 'Add Mentor'} size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mentor Name *</label>
              <input value={form.mentor} onChange={(e) => setForm((f) => ({ ...f, mentor: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Dr. Sarah Johnson" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title / Offering *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="PhD Application Strategy" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Brief bio and what this mentor offers..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expertise <span className="text-gray-400">(comma-separated)</span></label>
            <input value={form.expertise} onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="PhD, STEM, US Universities" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Booking Link <span className="text-gray-400">(optional)</span></label>
            <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://calendly.com/..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} className="w-4 h-4 rounded text-brand-600 border-gray-300" />
            <span className="text-sm font-medium text-gray-700">Available for bookings</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : editMentor ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
