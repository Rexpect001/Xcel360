'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff, CheckSquare, Square, X, FileText } from 'lucide-react'
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

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Detail modal
  const [detailRes, setDetailRes] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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
    setDetailOpen(false)
    setModalOpen(true)
  }

  const openDetail = (r: any) => {
    setDetailRes(r)
    setDetailOpen(true)
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
    if (res.ok) {
      setResources(p => p.filter(x => x.id !== id))
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
      setDetailOpen(false)
      toast.success('Removed')
    }
  }

  const togglePublish = async (r: any) => {
    const res = await fetch(`/api/admin/resources/${r.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !r.published }),
    })
    if (res.ok) {
      const updated = await res.json()
      setResources(p => p.map(x => x.id === updated.id ? updated : x))
      if (detailRes?.id === updated.id) setDetailRes(updated)
    }
  }

  // Bulk select helpers
  const allSelected = resources.length > 0 && resources.every(r => selected.has(r.id))
  const someSelected = selected.size > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(resources.map(r => r.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (action === 'delete' && !confirm(`Permanently delete ${selected.size} resource${selected.size > 1 ? 's' : ''}?`)) return
    setBulkLoading(true)
    const ids = Array.from(selected)
    const res = await fetch('/api/admin/resources/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action }),
    })
    if (res.ok) {
      if (action === 'delete') {
        setResources(p => p.filter(r => !ids.includes(r.id)))
      } else {
        const published = action === 'publish'
        setResources(p => p.map(r => ids.includes(r.id) ? { ...r, published } : r))
      }
      setSelected(new Set())
      const labels = { publish: 'Published', unpublish: 'Unpublished', delete: 'Deleted' }
      toast.success(`${labels[action]} ${ids.length} resource${ids.length > 1 ? 's' : ''}`)
    } else {
      toast.error('Bulk action failed')
    }
    setBulkLoading(false)
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
              <th className="px-4 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-brand-700 transition-colors">
                  {allSelected ? <CheckSquare className="h-4 w-4 text-brand-700" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">URL</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Visible</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {resources.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No resources yet — click Add Resource to start</td></tr>
            ) : resources.map(r => (
              <tr key={r.id} className={`hover:bg-gray-50 ${selected.has(r.id) ? 'bg-blue-50/60' : ''}`}>
                <td className="px-4 py-3">
                  <button onClick={() => toggleSelectOne(r.id)} className="text-gray-400 hover:text-brand-700 transition-colors">
                    {selected.has(r.id) ? <CheckSquare className="h-4 w-4 text-brand-700" /> : <Square className="h-4 w-4" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openDetail(r)} className="text-left group">
                    <div className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-1">{r.title}</div>
                    {r.description && <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{r.description}</div>}
                  </button>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{r.category}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-700 hover:text-brand-800 text-xs">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
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

      {/* Bulk action floating bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-medium text-gray-300">{selected.size} selected</span>
          <div className="w-px h-5 bg-gray-700" />
          <button
            onClick={() => handleBulkAction('publish')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
          >
            <Eye className="h-4 w-4" /> Publish
          </button>
          <button
            onClick={() => handleBulkAction('unpublish')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
          >
            <EyeOff className="h-4 w-4" /> Unpublish
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <div className="w-px h-5 bg-gray-700" />
          <button onClick={() => setSelected(new Set())} className="p-1 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Resource Details" size="md">
        {detailRes && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-base leading-snug">{detailRes.title}</h3>
                <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{detailRes.category}</span>
              </div>
            </div>

            {detailRes.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700">{detailRes.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">File URL</p>
              <a
                href={detailRes.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800 hover:underline break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                {detailRes.fileUrl}
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${detailRes.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {detailRes.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {detailRes.published ? 'Published' : 'Hidden'}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sort Order</p>
                <p className="text-sm text-gray-700">{detailRes.sortOrder ?? 0}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
                <p className="text-sm text-gray-700">
                  {detailRes.createdAt ? new Date(detailRes.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleDelete(detailRes.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-red-100 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                onClick={() => openEdit(detailRes)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors"
              >
                <Pencil className="h-4 w-4" /> Edit Resource
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit modal */}
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
