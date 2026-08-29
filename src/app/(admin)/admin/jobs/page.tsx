'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Star, StarOff, Search, Bot, Loader2,
  Sparkles, X, ExternalLink, Download, Upload, Eye
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { FIELDS, COUNTRIES } from '@/types'

// xlsx is heavy (~400KB) - loaded on demand inside import/export handlers
// instead of shipping with the page bundle.
type XLSXModule = typeof import('xlsx')

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote']
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Internship']

const emptyForm = {
  title: '',
  company: '',
  hostOrg: '',
  country: '',
  field: 'STEM' as string,
  jobType: 'Full-time',
  experienceLevel: 'Entry Level',
  salary: '',
  remote: false,
  deadline: '',
  eligibility: '',
  applicationLink: '',
  description: '',
  skills: '',
  requiredDocs: [] as string[],
  category: 'JOB',
  programLevel: [] as string[],
  fieldTags: [] as string[],
  fundingType: 'Paid',
  status: 'OPEN',
  featured: false,
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editJob, setEditJob] = useState<any | null>(null)
  const [detailJob, setDetailJob] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [aiPanel, setAiPanel] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiImage, setAiImage] = useState<{ data: string; mediaType: string; preview: string } | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState('')
  const [importPreview, setImportPreview] = useState<{ parsed: any[]; skipped: number; columns: string[]; samples: string[] } | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const xlsxInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/opportunities')
      .then((r) => r.json())
      .then((d) => {
        const all = Array.isArray(d) ? d : []
        setJobs(all.filter((j: any) => j.category === 'JOB' || j.category === 'INTERNSHIP'))
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase()
    const matchSearch = !q || j.title.toLowerCase().includes(q) || (j.company ?? j.hostOrg ?? '').toLowerCase().includes(q)
    const matchCat = !categoryFilter || j.category === categoryFilter
    return matchSearch && matchCat
  })

  const openAdd = (cat = 'JOB') => {
    setEditJob(null)
    setAiPanel(false)
    setAiText('')
    setAiImage(null)
    setForm({ ...emptyForm, category: cat, fundingType: cat === 'INTERNSHIP' ? 'Stipend' : 'Paid' })
    setModalOpen(true)
  }

  const openEdit = (job: any) => {
    setEditJob(job)
    setAiPanel(false)
    setAiText('')
    setAiImage(null)
    setForm({
      title: job.title,
      company: job.company ?? '',
      hostOrg: job.hostOrg ?? '',
      country: job.country,
      field: job.field,
      jobType: job.jobType ?? 'Full-time',
      experienceLevel: job.experienceLevel ?? 'Entry Level',
      salary: job.salary ?? '',
      remote: job.remote ?? false,
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      eligibility: job.eligibility,
      applicationLink: job.applicationLink,
      description: job.description ?? '',
      skills: (job.skills ?? []).join(', '),
      requiredDocs: job.requiredDocs ?? [],
      category: job.category,
      programLevel: job.programLevel ?? [],
      fieldTags: job.fieldTags ?? [],
      fundingType: job.fundingType,
      status: job.status,
      featured: job.featured,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      deadline: new Date(form.deadline).toISOString(),
      skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      hostOrg: form.company || form.hostOrg || 'Unknown',
      programLevel: form.programLevel.length > 0 ? form.programLevel : [],
    }
    try {
      const res = await fetch(
        editJob ? `/api/admin/opportunities/${editJob.id}` : '/api/admin/opportunities',
        { method: editJob ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      )
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); setSaving(false); return }
      toast.success(editJob ? 'Updated!' : 'Posted!')
      setModalOpen(false)
      load()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this posting?')) return
    const res = await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); load() }
    else toast.error('Failed to delete')
  }

  const toggleFeatured = async (job: any) => {
    await fetch(`/api/admin/opportunities/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !job.featured }),
    })
    load()
  }

  // ── AI image upload ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return }
    // Resize + compress via canvas  -  prevents browser freeze on large images
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', 0.82)
      const base64 = compressed.split(',')[1]
      setAiImage({ data: base64, mediaType: 'image/jpeg', preview: compressed })
    }
    img.src = objectUrl
  }

  // ── AI extract ──
  const extractWithAI = async () => {
    if (!aiText.trim() && !aiImage) return
    setExtracting(true)
    try {
      const res = await fetch('/api/agent/extract-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText, image: aiImage ? { data: aiImage.data, mediaType: aiImage.mediaType } : undefined }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Extraction failed'); return }
      if (data.title) {
        const ext = data
        setForm((f) => ({
          ...f,
          title: ext.title ?? f.title,
          company: ext.hostOrg ?? f.company,
          hostOrg: ext.hostOrg ?? f.hostOrg,
          country: ext.country ?? f.country,
          field: ext.field ?? f.field,
          deadline: ext.deadline ? ext.deadline.split('T')[0] : f.deadline,
          eligibility: ext.eligibility ?? f.eligibility,
          applicationLink: ext.applicationLink ?? f.applicationLink,
          description: ext.description ?? f.description,
          requiredDocs: ext.requiredDocs ?? f.requiredDocs,
          fieldTags: ext.fieldTags ?? f.fieldTags,
          salary: ext.salary ?? f.salary,
          jobType: ext.jobType ?? f.jobType,
          experienceLevel: ext.experienceLevel ?? f.experienceLevel,
          skills: ext.skills ? (Array.isArray(ext.skills) ? ext.skills.join(', ') : ext.skills) : f.skills,
        }))
        setAiPanel(false)
        toast.success('AI extracted job details!')
      } else {
        toast.error('Could not extract job details')
      }
    } catch {
      toast.error('AI extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  // ── Excel export ──
  const exportExcel = async () => {
    if (filtered.length === 0) { toast.error('No postings to export'); return }
    const XLSX: XLSXModule = await import('xlsx')
    const rows = filtered.map((j) => ({
      Title: j.title,
      Category: j.category,
      Company: j.company ?? j.hostOrg,
      Country: j.country,
      'Job Type': j.jobType ?? '',
      'Experience Level': j.experienceLevel ?? '',
      Salary: j.salary ?? '',
      Remote: j.remote ? 'Yes' : 'No',
      Field: j.field,
      Skills: (j.skills ?? []).join(', '),
      Deadline: j.deadline ? new Date(j.deadline).toISOString().split('T')[0] : '',
      Status: j.status,
      Featured: j.featured ? 'Yes' : 'No',
      Requirements: j.eligibility,
      'Application Link': j.applicationLink,
      Description: j.description ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jobs')
    XLSX.writeFile(wb, `xcel360-jobs-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success(`Exported ${filtered.length} postings`)
  }

  // ── Excel template ──
  const downloadTemplate = async () => {
    const XLSX: XLSXModule = await import('xlsx')
    const sample = [{
      Title: 'Software Engineer  -  Remote',
      Category: 'JOB',
      Company: 'Acme Corp',
      Country: 'Nigeria',
      'Job Type': 'Full-time',
      'Experience Level': 'Mid Level',
      Salary: '$40,000 - $60,000/yr',
      Remote: 'Yes',
      Field: 'STEM',
      Skills: 'React, Node.js, PostgreSQL',
      Deadline: '2025-12-31',
      Status: 'OPEN',
      Featured: 'No',
      Requirements: 'BSc in Computer Science or related field, 2+ years experience',
      'Application Link': 'https://example.com/apply',
      Description: 'We are looking for a skilled software engineer to join our team.',
    }]
    const ws = XLSX.utils.json_to_sheet(sample)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jobs')
    XLSX.writeFile(wb, 'xcel360-jobs-template.xlsx')
    toast.success('Template downloaded!')
  }

  // ── Parse Excel rows for jobs ──
  const parseJobRows = (rows: any[]): { parsed: any[]; skipped: number; columns: string[] } => {
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
    const findCol = (row: any, ...keywords: string[]): string => {
      const rowKeys = Object.keys(row)
      for (const kw of keywords) {
        const found = rowKeys.find(k => k.toLowerCase().trim() === kw.toLowerCase().trim())
        if (found && String(row[found]).trim()) return String(row[found]).trim()
      }
      for (const kw of keywords) {
        const kwl = kw.toLowerCase()
        const found = rowKeys.find(k => { const kl = k.toLowerCase().trim(); return kl.includes(kwl) || kwl.includes(kl) })
        if (found && String(row[found]).trim()) return String(row[found]).trim()
      }
      return ''
    }
    const parseDate = (val: any): string => {
      if (!val) return new Date(Date.now() + 90 * 86400000).toISOString()
      if (val instanceof Date && !isNaN(val.getTime())) return val.toISOString()
      const str = String(val).trim()
      if (/^\d{4,5}$/.test(str)) {
        const d = new Date(new Date(1899, 11, 30).getTime() + parseInt(str) * 86400000)
        if (!isNaN(d.getTime())) return d.toISOString()
      }
      const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
      if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`).toISOString()
      const d = new Date(str)
      return isNaN(d.getTime()) ? new Date(Date.now() + 90 * 86400000).toISOString() : d.toISOString()
    }
    const parsed: any[] = []
    let skipped = 0
    for (const row of rows) {
      const title = findCol(row, 'title', 'job title', 'position', 'role', 'name')
      if (!title) { skipped++; continue }
      const deadlineKey = Object.keys(row).find(k => /deadline|due|clos|end.?date|apply.?by/i.test(k))
      const deadline = parseDate(deadlineKey ? row[deadlineKey] : null)
      const catRaw = findCol(row, 'category', 'type', 'kind').toUpperCase()
      const category = catRaw.includes('INTERN') ? 'INTERNSHIP' : 'JOB'
      const company = findCol(row, 'company', 'organisation', 'organization', 'employer', 'host')
      const country = findCol(row, 'country', 'location', 'nation')
      const field = findCol(row, 'field', 'subject', 'discipline', 'area')
      const jobType = findCol(row, 'job type', 'type', 'employment type', 'contract type')
      const experienceLevel = findCol(row, 'experience level', 'experience', 'level', 'seniority')
      const salary = findCol(row, 'salary', 'pay', 'compensation', 'stipend', 'remuneration')
      const remoteRaw = findCol(row, 'remote', 'work from home', 'wfh')
      const skills = findCol(row, 'skills', 'required skills', 'tech stack', 'technologies')
      const eligibility = findCol(row, 'requirements', 'eligibility', 'qualifications', 'criteria')
      const description = findCol(row, 'description', 'about', 'details', 'summary')
      const appLink = findCol(row, 'application link', 'link', 'url', 'apply', 'apply link')
      const featuredRaw = findCol(row, 'featured', 'highlight')
      parsed.push({
        title,
        category,
        company: company || 'Unknown',
        hostOrg: company || 'Unknown',
        country: country || 'International',
        field: ['STEM', 'Non-STEM'].includes(field) ? field : 'STEM',
        jobType: jobType || 'Full-time',
        experienceLevel: experienceLevel || 'Entry Level',
        salary: salary || null,
        remote: ['yes', 'true', '1', 'remote'].includes(remoteRaw.toLowerCase()),
        skills: skills ? skills.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean) : [],
        eligibility: eligibility || '',
        description: description || null,
        applicationLink: appLink || '',
        deadline,
        programLevel: [],
        fieldTags: [],
        requiredDocs: ['CV', 'Cover Letter'],
        fundingType: category === 'INTERNSHIP' ? 'Stipend' : 'Paid',
        status: 'OPEN',
        featured: ['yes', 'true', '1'].includes(featuredRaw.toLowerCase()),
        views: 0,
      })
    }
    return { parsed, skipped, columns }
  }

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportProgress('Reading file...')
    try {
      const XLSX: XLSXModule = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })
      if (rows.length === 0) { toast.error('No rows found'); setImporting(false); return }
      setImportProgress(`Parsing ${rows.length} rows...`)
      const { parsed, skipped, columns } = parseJobRows(rows)
      setImportPreview({ parsed, skipped, columns, samples: parsed.slice(0, 5).map(p => p.title) })
    } catch {
      toast.error('Failed to read Excel file')
    } finally {
      setImporting(false)
      setImportProgress('')
      if (xlsxInputRef.current) xlsxInputRef.current.value = ''
    }
  }

  const confirmImport = async () => {
    if (!importPreview) return
    const { parsed } = importPreview
    const skippedCount = importPreview.skipped
    setImportPreview(null)
    setImporting(true)
    const CHUNK = 200
    let totalCreated = 0
    let totalFailed = 0
    for (let i = 0; i < parsed.length; i += CHUNK) {
      const chunk = parsed.slice(i, i + CHUNK)
      setImportProgress(`Uploading... ${i + chunk.length} / ${parsed.length}`)
      try {
        const res = await fetch('/api/admin/opportunities/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        })
        const result = await res.json()
        if (res.ok) { totalCreated += result.created ?? 0; totalFailed += (result.failed ?? 0) + (result.duplicates ?? 0) }
        else totalFailed += chunk.length
      } catch { totalFailed += chunk.length }
    }
    toast.success(`Imported ${totalCreated} postings` + (totalFailed > 0 ? ` · ${totalFailed} skipped/failed` : '') + (skippedCount > 0 ? ` · ${skippedCount} rows had no title` : ''))
    load()
    setImporting(false)
    setImportProgress('')
  }

  // ── Bulk ──
  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => { if (selected.size === filtered.length) setSelected(new Set()); else setSelected(new Set(filtered.map(j => j.id))) }
  const bulkAction = async (action: string) => {
    if (selected.size === 0) return
    if (action === 'delete' && !confirm(`Delete ${selected.size} postings?`)) return
    setBulkLoading(true)
    await fetch('/api/admin/opportunities/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), action }),
    })
    setSelected(new Set())
    load()
    setBulkLoading(false)
    toast.success('Done')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs & Internships</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} total · {jobs.filter(j=>j.category==='JOB').length} jobs · {jobs.filter(j=>j.category==='INTERNSHIP').length} internships</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Template
          </button>
          <label className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 cursor-pointer">
            <Upload className="h-4 w-4" />
            {importing ? importProgress || 'Importing...' : 'Import Excel'}
            <input ref={xlsxInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} disabled={importing} />
          </label>
          <button onClick={exportExcel} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => openAdd('JOB')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Job
          </button>
          <button onClick={() => openAdd('INTERNSHIP')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700">
            <Plus className="h-4 w-4" /> Add Internship
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search jobs, companies..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">All types</option>
          <option value="JOB">Jobs only</option>
          <option value="INTERNSHIP">Internships only</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-brand-50 rounded-xl border border-brand-100">
          <span className="text-sm font-medium text-brand-700">{selected.size} selected</span>
          <button onClick={() => bulkAction('feature')} disabled={bulkLoading} className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200">Feature</button>
          <button onClick={() => bulkAction('unfeature')} disabled={bulkLoading} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Unfeature</button>
          <button onClick={() => bulkAction('open')} disabled={bulkLoading} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200">Open</button>
          <button onClick={() => bulkAction('close')} disabled={bulkLoading} className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200">Close</button>
          <button onClick={() => bulkAction('delete')} disabled={bulkLoading} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200">Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-left w-10">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
              </th>
              <th className="p-4 text-left font-medium text-gray-600">Title</th>
              <th className="p-4 text-left font-medium text-gray-600">Type</th>
              <th className="p-4 text-left font-medium text-gray-600">Company</th>
              <th className="p-4 text-left font-medium text-gray-600">Country</th>
              <th className="p-4 text-left font-medium text-gray-600">Deadline</th>
              <th className="p-4 text-left font-medium text-gray-600">Status</th>
              <th className="p-4 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">No postings yet.</td></tr>
            ) : filtered.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4"><input type="checkbox" checked={selected.has(job.id)} onChange={() => toggleSelect(job.id)} className="rounded border-gray-300" /></td>
                <td className="p-4 max-w-[200px]">
                  <button onClick={() => setDetailJob(job)} className="font-medium text-gray-900 truncate block hover:text-brand-700 text-left">{job.title}</button>
                  {job.remote && <span className="text-xs text-green-600">Remote</span>}
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${job.category === 'INTERNSHIP' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {job.category === 'INTERNSHIP' ? 'Internship' : 'Job'}
                  </span>
                </td>
                <td className="p-4 text-gray-600 truncate max-w-[120px]">{job.company ?? job.hostOrg}</td>
                <td className="p-4 text-gray-600">{job.country}</td>
                <td className="p-4 text-gray-600">{formatDate(job.deadline)}</td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{job.status}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleFeatured(job)} className="p-1.5 hover:bg-yellow-50 rounded-lg text-gray-400 hover:text-yellow-500">
                      {job.featured ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <StarOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setDetailJob(job)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Eye className="h-4 w-4" /></button>
                    <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><ExternalLink className="h-4 w-4" /></a>
                    <button onClick={() => openEdit(job)} className="p-1.5 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(job.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detailJob && (
        <Modal open={!!detailJob} onClose={() => setDetailJob(null)} title={detailJob.title}>
          <dl className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><dt className="text-xs text-gray-500">Category</dt><dd className="font-medium">{detailJob.category}</dd></div>
              <div><dt className="text-xs text-gray-500">Job Type</dt><dd className="font-medium">{detailJob.jobType ?? ' - '}</dd></div>
              <div><dt className="text-xs text-gray-500">Company</dt><dd className="font-medium">{detailJob.company ?? detailJob.hostOrg}</dd></div>
              <div><dt className="text-xs text-gray-500">Country</dt><dd className="font-medium">{detailJob.country}</dd></div>
              <div><dt className="text-xs text-gray-500">Salary</dt><dd className="font-medium text-emerald-700">{detailJob.salary ?? ' - '}</dd></div>
              <div><dt className="text-xs text-gray-500">Experience</dt><dd className="font-medium">{detailJob.experienceLevel ?? ' - '}</dd></div>
              <div><dt className="text-xs text-gray-500">Remote</dt><dd className="font-medium">{detailJob.remote ? 'Yes' : 'No'}</dd></div>
              <div><dt className="text-xs text-gray-500">Deadline</dt><dd className="font-medium">{formatDate(detailJob.deadline)}</dd></div>
            </div>
            {detailJob.skills?.length > 0 && <div><dt className="text-xs text-gray-500 mb-1">Skills</dt><dd className="flex flex-wrap gap-1">{detailJob.skills.map((s: string) => <span key={s} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">{s}</span>)}</dd></div>}
            {detailJob.description && <div><dt className="text-xs text-gray-500 mb-1">Description</dt><dd className="text-gray-600 text-xs leading-relaxed">{detailJob.description}</dd></div>}
            {detailJob.eligibility && <div><dt className="text-xs text-gray-500 mb-1">Requirements</dt><dd className="text-gray-600 text-xs">{detailJob.eligibility}</dd></div>}
          </dl>
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => { setDetailJob(null); openEdit(detailJob) }} className="flex items-center gap-1.5 px-3 py-2 bg-brand-700 text-white rounded-xl text-sm font-medium">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button onClick={() => { handleDelete(detailJob.id); setDetailJob(null) }} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Import preview modal */}
      {importPreview && (
        <Modal open={!!importPreview} onClose={() => setImportPreview(null)} title="Import Preview" size="lg">
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <span className="text-green-700 font-semibold">{importPreview.parsed.length} ready to import</span>
              {importPreview.skipped > 0 && <span className="text-orange-600">{importPreview.skipped} rows skipped (no title)</span>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Sample titles:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {importPreview.samples.map((s, i) => <li key={i} className="truncate">• {s}</li>)}
                {importPreview.parsed.length > 5 && <li className="text-gray-400 text-xs">…and {importPreview.parsed.length - 5} more</li>}
              </ul>
            </div>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={confirmImport} className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                <Upload className="h-4 w-4" /> Confirm Import
              </button>
              <button onClick={() => setImportPreview(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editJob ? 'Edit Posting' : `Add ${form.category === 'INTERNSHIP' ? 'Internship' : 'Job'}`} size="xl">
        {/* AI Panel */}
        <div className="mb-4">
          <button type="button" onClick={() => setAiPanel(!aiPanel)}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
            <Bot className="h-4 w-4" />
            {aiPanel ? 'Hide AI Auto-fill' : 'AI Auto-fill from job posting'}
            <Sparkles className="h-3.5 w-3.5" />
          </button>
          {aiPanel && (
            <div className="mt-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <textarea value={aiText} onChange={(e) => setAiText(e.target.value)}
                placeholder="Paste full job posting text here..." rows={4}
                className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
              <div className="flex items-center gap-3 mt-2">
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100">
                  📎 {aiImage ? 'Image attached' : 'Attach image'}
                </button>
                {aiImage && (
                  <div className="flex items-center gap-2">
                    <img src={aiImage.preview} alt="preview" className="h-8 w-8 object-cover rounded" />
                    <button type="button" onClick={() => setAiImage(null)} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                  </div>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <button type="button" onClick={extractWithAI} disabled={extracting || (!aiText.trim() && !aiImage)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {extracting ? 'Extracting...' : 'Extract with AI'}
                </button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="JOB">Job</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job Type</label>
              <select value={form.jobType} onChange={(e) => setForm((f) => ({ ...f, jobType: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company / Organisation *</label>
              <input required value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value, hostOrg: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country *</label>
              <select required value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
              <select value={form.field} onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experience Level</label>
              <select value={form.experienceLevel} onChange={(e) => setForm((f) => ({ ...f, experienceLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Salary / Stipend</label>
              <input value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                placeholder="e.g. $50,000  -  $70,000/yr"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Application Deadline *</label>
              <input required type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
            <input value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              placeholder="React, Node.js, Python..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Application Link *</label>
            <input required type="url" value={form.applicationLink} onChange={(e) => setForm((f) => ({ ...f, applicationLink: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Requirements *</label>
            <textarea required value={form.eligibility} onChange={(e) => setForm((f) => ({ ...f, eligibility: e.target.value }))}
              rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.remote} onChange={(e) => setForm((f) => ({ ...f, remote: e.target.checked }))} className="rounded border-gray-300 text-brand-600" />
              Remote position
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="rounded border-gray-300 text-brand-600" />
              Featured
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-brand-700 text-white rounded-xl text-sm font-medium hover:bg-brand-800 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editJob ? 'Update' : 'Post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
