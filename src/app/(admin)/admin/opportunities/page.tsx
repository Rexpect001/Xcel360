'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Star, StarOff, Search, Bot, Loader2, ChevronDown, ChevronUp, Sparkles, ImagePlus, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { PROGRAM_LEVELS, FIELDS, FUNDING_TYPES, COUNTRIES } from '@/types'

const emptyForm = {
  title: '',
  hostOrg: '',
  country: '',
  fundingType: 'Fully funded',
  field: 'STEM',
  deadline: '',
  eligibility: '',
  applicationLink: '',
  description: '',
  programLevel: [] as string[],
  fieldTags: [] as string[],
  requiredDocs: ['CV', 'SOP', 'Transcripts', 'References'] as string[],
  status: 'OPEN',
  featured: false,
}

export default function AdminOpportunitiesPage() {
  const [opps, setOpps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editOpp, setEditOpp] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [aiPanel, setAiPanel] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiImage, setAiImage] = useState<{ data: string; mediaType: string; preview: string } | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [aiError, setAiError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/opportunities')
      .then((r) => r.json())
      .then((d) => { setOpps(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const openAdd = () => {
    setEditOpp(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (opp: any) => {
    setEditOpp(opp)
    setForm({
      title: opp.title,
      hostOrg: opp.hostOrg,
      country: opp.country,
      fundingType: opp.fundingType,
      field: opp.field,
      deadline: opp.deadline ? new Date(opp.deadline).toISOString().split('T')[0] : '',
      eligibility: opp.eligibility,
      applicationLink: opp.applicationLink,
      description: opp.description ?? '',
      programLevel: opp.programLevel ?? [],
      fieldTags: opp.fieldTags ?? [],
      requiredDocs: opp.requiredDocs ?? [],
      status: opp.status,
      featured: opp.featured,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.hostOrg || !form.deadline || !form.applicationLink) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    const body = { ...form, deadline: new Date(form.deadline).toISOString() }
    const url = editOpp ? `/api/admin/opportunities/${editOpp.id}` : '/api/admin/opportunities'
    const method = editOpp ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      if (editOpp) setOpps((p) => p.map((o) => (o.id === updated.id ? updated : o)))
      else setOpps((p) => [updated, ...p])
      toast.success(editOpp ? 'Updated!' : 'Created!')
      setModalOpen(false)
    } else {
      toast.error('Error saving opportunity')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this opportunity? This cannot be undone.')) return
    const res = await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setOpps((p) => p.filter((o) => o.id !== id))
      toast.success('Deleted')
    }
  }

  const toggleFeatured = async (opp: any) => {
    const res = await fetch(`/api/admin/opportunities/${opp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !opp.featured }),
    })
    if (res.ok) {
      const updated = await res.json()
      setOpps((p) => p.map((o) => (o.id === updated.id ? updated : o)))
    }
  }

  const toggleProgramLevel = (level: string) => {
    setForm((f) => ({
      ...f,
      programLevel: f.programLevel.includes(level)
        ? f.programLevel.filter((l) => l !== level)
        : [...f.programLevel, level],
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const [prefix, base64] = result.split(',')
      const mediaType = prefix.replace('data:', '').replace(';base64', '')
      setAiImage({ data: base64, mediaType, preview: result })
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setAiImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAiExtract = async () => {
    if (!aiText.trim() && !aiImage) return
    setExtracting(true)
    setAiError('')
    try {
      const res = await fetch('/api/agent/extract-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText || undefined,
          image: aiImage ? { data: aiImage.data, mediaType: aiImage.mediaType } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error ?? 'Extraction failed')
        return
      }
      // Populate form with extracted data
      setForm({
        title: data.title ?? '',
        hostOrg: data.hostOrg ?? '',
        country: data.country ?? '',
        fundingType: data.fundingType ?? 'Fully funded',
        field: data.field ?? 'STEM',
        deadline: data.deadline ?? '',
        eligibility: data.eligibility ?? '',
        applicationLink: data.applicationLink ?? '',
        description: data.description ?? '',
        programLevel: Array.isArray(data.programLevel) ? data.programLevel : [],
        fieldTags: Array.isArray(data.fieldTags) ? data.fieldTags : [],
        requiredDocs: Array.isArray(data.requiredDocs) ? data.requiredDocs : ['CV', 'SOP', 'Transcripts'],
        status: 'OPEN',
        featured: false,
      })
      setEditOpp(null)
      setAiPanel(false)
      setAiText('')
      setAiImage(null)
      setModalOpen(true)
      toast.success('Scholarship extracted — review and publish!')
    } catch {
      setAiError('Something went wrong. Try again.')
    } finally {
      setExtracting(false)
    }
  }

  const filtered = opps.filter(
    (o) =>
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.hostOrg?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-500 mt-1">{opps.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAiPanel((v) => !v); setAiError('') }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              aiPanel
                ? 'bg-violet-700 text-white border-violet-700'
                : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'
            }`}
          >
            <Bot className="h-4 w-4" />
            AI Auto-Post
            {aiPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Opportunity
          </button>
        </div>
      </div>

      {/* AI Auto-Post panel */}
      {aiPanel && (
        <div className="mb-6 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Scholarship Extractor</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Upload a flyer/image, paste text, or both. Claude reads the content and fills the form automatically.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-3">
            {/* Image upload */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Upload Image (flyer, screenshot, poster)</p>
              {aiImage ? (
                <div className="relative rounded-xl overflow-hidden border border-violet-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aiImage.preview} alt="Uploaded flyer" className="w-full h-40 object-contain" />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-violet-200 rounded-xl flex flex-col items-center justify-center gap-2 text-violet-500 hover:border-violet-400 hover:bg-violet-50 transition-colors bg-white"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="text-xs text-gray-400">JPG, PNG, WebP · max 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Text paste */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Paste Text (optional — adds context to image)</p>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows={6}
                placeholder="Paste scholarship info here — from an email, webpage, or social post. Works alone or alongside an image."
                className="w-full h-40 px-4 py-3 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {aiError && (
            <p className="text-sm text-red-600 mb-3 flex items-center gap-1">
              <span className="font-medium">Error:</span> {aiError}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAiExtract}
              disabled={extracting || (!aiText.trim() && !aiImage)}
              className="flex items-center gap-2 bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-800 disabled:opacity-50 transition-colors"
            >
              {extracting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Extracting...</>
              ) : (
                <><Bot className="h-4 w-4" /> Extract & Fill Form</>
              )}
            </button>
            <button
              onClick={() => { setAiPanel(false); setAiText(''); setAiImage(null); setAiError('') }}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search opportunities..."
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Country</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Deadline</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No opportunities found
                  </td>
                </tr>
              ) : (
                filtered.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 line-clamp-1">{opp.title}</div>
                      <div className="text-xs text-gray-500">{opp.hostOrg}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{opp.country}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {opp.deadline ? formatDate(opp.deadline) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          opp.status === 'OPEN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {opp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleFeatured(opp)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            opp.featured
                              ? 'text-yellow-500 hover:bg-yellow-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={opp.featured ? 'Remove featured' : 'Mark featured'}
                        >
                          {opp.featured ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(opp)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(opp.id)}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editOpp ? 'Edit Opportunity' : 'Add Opportunity'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Fulbright Foreign Student Program"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Host Organization *</label>
              <input
                value={form.hostOrg}
                onChange={(e) => setForm((f) => ({ ...f, hostOrg: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="University or organization"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country *</label>
              <select
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Funding Type *</label>
              <select
                value={form.fundingType}
                onChange={(e) => setForm((f) => ({ ...f, fundingType: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {FUNDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Field *</label>
              <select
                value={form.field}
                onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deadline *</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Application Link *</label>
              <input
                value={form.applicationLink}
                onChange={(e) => setForm((f) => ({ ...f, applicationLink: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-2">Program Level *</label>
              <div className="flex flex-wrap gap-2">
                {PROGRAM_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleProgramLevel(level)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.programLevel.includes(level)
                        ? 'bg-brand-700 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Eligibility *</label>
              <textarea
                rows={2}
                value={form.eligibility}
                onChange={(e) => setForm((f) => ({ ...f, eligibility: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Who is eligible to apply..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Full scholarship description..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="w-4 h-4 rounded text-brand-600 border-gray-300"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Mark as Featured (shows on homepage)
            </label>
          </div>

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
              className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving...' : editOpp ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
