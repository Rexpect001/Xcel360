'use client'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, CheckSquare, Square, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

const emptyForm = {
  title: '',
  slug: '',
  author: '',
  excerpt: '',
  content: '',
  tags: '',
  published: false,
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPost, setEditPost] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Bulk select state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Detail modal state
  const [detailPost, setDetailPost] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/blog')
      .then((r) => r.json())
      .then((d) => { setPosts(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const openAdd = () => {
    setEditPost(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (post: any) => {
    setDetailOpen(false)
    setDetailPost(null)
    setEditPost(post)
    setForm({
      title: post.title,
      slug: post.slug,
      author: post.author,
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      tags: (post.tags ?? []).join(', '),
      published: post.published,
    })
    setModalOpen(true)
  }

  const openDetail = (post: any) => {
    setDetailPost(post)
    setDetailOpen(true)
  }

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: editPost ? f.slug : toSlug(title),
    }))
  }

  const handleSave = async () => {
    if (!form.title || !form.author) {
      toast.error('Title and author are required')
      return
    }
    setSaving(true)
    const body = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }
    const url = editPost ? `/api/admin/blog/${editPost.id}` : '/api/admin/blog'
    const method = editPost ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editPost) setPosts((p) => p.map((x) => (x.id === updated.id ? updated : x)))
      else setPosts((p) => [updated, ...p])
      toast.success(editPost ? 'Updated!' : 'Created!')
      setModalOpen(false)
    } else {
      toast.error('Error saving post')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts((p) => p.filter((x) => x.id !== id))
      setSelected((s) => { const n = new Set(s); n.delete(id); return n })
      if (detailPost?.id === id) setDetailOpen(false)
      toast.success('Deleted')
    }
  }

  const togglePublished = async (post: any) => {
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPosts((p) => p.map((x) => (x.id === updated.id ? updated : x)))
      if (detailPost?.id === updated.id) setDetailPost(updated)
    }
  }

  // Bulk selection helpers
  const filtered = posts.filter(
    (p) => p.title?.toLowerCase().includes(search.toLowerCase()) ||
           p.author?.toLowerCase().includes(search.toLowerCase())
  )

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  const someSelected = selected.size > 0

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((s) => {
        const n = new Set(s)
        filtered.forEach((p) => n.delete(p.id))
        return n
      })
    } else {
      setSelected((s) => {
        const n = new Set(s)
        filtered.forEach((p) => n.add(p.id))
        return n
      })
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (action === 'delete' && !confirm(`Delete ${ids.length} post${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return

    setBulkLoading(true)
    const res = await fetch('/api/admin/blog/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action }),
    })
    if (res.ok) {
      if (action === 'delete') {
        setPosts((p) => p.filter((x) => !ids.includes(x.id)))
      } else {
        const published = action === 'publish'
        setPosts((p) => p.map((x) => ids.includes(x.id) ? { ...x, published } : x))
      }
      setSelected(new Set())
      toast.success(
        action === 'delete'
          ? `Deleted ${ids.length} post${ids.length > 1 ? 's' : ''}`
          : `${action === 'publish' ? 'Published' : 'Unpublished'} ${ids.length} post${ids.length > 1 ? 's' : ''}`
      )
    } else {
      toast.error('Bulk action failed')
    }
    setBulkLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Blog & Guides</h1>
          <p className="text-gray-500 mt-1">{posts.length} total posts</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Post
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
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
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-brand-700 transition-colors"
                    title={allFilteredSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allFilteredSelected
                      ? <CheckSquare className="h-4 w-4 text-brand-700" />
                      : <Square className="h-4 w-4" />
                    }
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Author</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Tags</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No posts found</td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 w-10">
                      <button
                        onClick={() => toggleSelectOne(post.id)}
                        className="text-gray-400 hover:text-brand-700 transition-colors"
                      >
                        {selected.has(post.id)
                          ? <CheckSquare className="h-4 w-4 text-brand-700" />
                          : <Square className="h-4 w-4" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(post)}
                        className="font-medium text-gray-900 hover:text-brand-700 transition-colors text-left line-clamp-1"
                      >
                        {post.title}
                      </button>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{post.author}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags ?? []).slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(post.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => togglePublished(post)} className={`p-1.5 rounded-lg transition-colors ${post.published ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={post.published ? 'Unpublish' : 'Publish'}>
                          {post.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
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

      {/* Floating bulk action bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-medium text-gray-300">
            {selected.size} selected
          </span>
          <div className="w-px h-5 bg-gray-600" />
          <button
            onClick={() => handleBulkAction('publish')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Publish
          </button>
          <button
            onClick={() => handleBulkAction('unpublish')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
          >
            <EyeOff className="h-4 w-4" />
            Unpublish
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <div className="w-px h-5 bg-gray-600" />
          <button
            onClick={() => setSelected(new Set())}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Post Details" size="lg">
        {detailPost && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">{detailPost.title}</h3>
              <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-semibold ${detailPost.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {detailPost.published ? 'Published' : 'Draft'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Author</p>
                <p className="text-gray-900">{detailPost.author}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Created</p>
                <p className="text-gray-900">{formatDate(detailPost.createdAt)}</p>
              </div>
            </div>

            {(detailPost.tags ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {(detailPost.tags ?? []).map((tag: string) => (
                    <span key={tag} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {detailPost.excerpt && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Excerpt</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5">{detailPost.excerpt}</p>
              </div>
            )}

            {detailPost.content && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Content</p>
                <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5 whitespace-pre-wrap">
                  {detailPost.content.length > 300
                    ? detailPost.content.slice(0, 300) + '...'
                    : detailPost.content}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => handleDelete(detailPost.id)}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-100 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={() => openEdit(detailPost)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit Post
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editPost ? 'Edit Post' : 'New Post'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Post title"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                placeholder="auto-generated"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Author *</label>
              <input
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Xcel360 Team"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Excerpt</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Short summary shown in listings..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Full article content..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tags <span className="text-gray-400">(comma-separated)</span></label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="scholarships, STEM, writing"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 rounded text-brand-600 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Publish immediately</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors">
              {saving ? 'Saving...' : editPost ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
