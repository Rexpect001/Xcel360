'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

const CATEGORIES = ['CV Template', 'SOP Template', 'Cover Letter', 'Research Proposal', 'Guide', 'Checklist', 'Other']

const emptyForm = {
  title: '', description: '', category: 'CV Template',
  fileUrl: '', filename: '', published: true, sortOrder: '0',
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRes, setEditRes] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/resources')
      .then(r => r.json())
      .then(d => { setResources(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const openAdd = () => { setEditRes(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (r: any) => {
    setEditRes(r)
    setForm({
      title: r.title, description: r.description ?? '',
      category: r.category, fileUrl: r.fileUrl,
      filename: r.filename ?? '', published: r.published,
      sortOrder: String(r.sortOrder ?? 0),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.fileUrl) { toast.error('Title and file URL are required'); return }
    setSaving(true)
    const url = editRes ? `/api/admin/resources/${editRes.id}` : '/api/admin/resources'
    const method = editRes ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const updated = await res.json()
      if (editRes) setResources(p => p.map(x => x.id === updated.id ? updated : x))
      else setResources(p => [...p, updated].sort((a, b) => a.sortOrder - b.sortOrder))
      toast.success(editRes ? 'Updated!' : 'Resource added!')
      setModalOpen(false)
    } else { toast.error('Error saving') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this resource?')) return
    const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' })
    if (res.ok) { setResources(p => p.filter(x => x.id !== id)); toast.success('Removed') }
  }

  const togglePublish = async (r: any) => {
    const res = await fetch(`/api/admin/resources/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !r.published }),
    })
    if (res.ok) {
      const updated = await res.json()
      setResources(p => p.map(x => x.id === updated.id ? updated : x))
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources & Templates</h1>
          <p className="text-gray-500 mt-1">{resources.length} resources · shown on the public Resources page</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors">
          <Plus className="h-4 w-4" /> Add Resource
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 mb-6">
        Paste any external link in the <strong>File URL</strong> field — Google Drive, Dropbox, OneDrive, or a direct download link. No file uploads needed.
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">URL</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Visible</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {resources.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No resources yet — click Add Resource to start</td></tr>
            ) : resources.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 line-clamp-1">{r.title}</div>
                  {r.description && <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{r.description}</div>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{r.category}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-700 hover:text-brand-800 text-xs">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{r.fileUrl}</span>
                  </a>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => togglePublish(r)} className={`p-1.5 rounded-lg transition-colors ${r.published ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}>
                    {r.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRes ? 'Edit Resource' : 'Add Resource'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Sample CV — STEM" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="0 = first" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">File URL * <span className="text-gray-400">(Google Drive, Dropbox, or direct link)</span></label>
            <input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://drive.google.com/..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Suggested Filename <span className="text-gray-400">(optional)</span></label>
            <input value={form.filename} onChange={e => setForm(f => ({ ...f, filename: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Xcel360-CV-Template-STEM.pdf" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Brief description of what's inside..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="w-4 h-4 rounded text-brand-600" />
            <label htmlFor="pub" className="text-sm font-medium text-gray-700">Visible on public Resources page</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60">{saving ? 'Saving...' : editRes ? 'Update' : 'Add Resource'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
