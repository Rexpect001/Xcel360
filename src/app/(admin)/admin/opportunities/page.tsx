'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Pencil, Trash2, Star, StarOff, Search, Loader2, X, Download, Upload, Eye, ExternalLink, Calendar, Globe, Building2, BookOpen, FileCheck, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { PROGRAM_LEVELS, FIELDS, FUNDING_TYPES, COUNTRIES } from '@/types'
// xlsx is lazy-loaded only when export/import is triggered — avoids 500KB upfront parse

const PAGE_SIZE = 50

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
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editOpp, setEditOpp] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const xlsxInputRef = useRef<HTMLInputElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detail view modal
  const [detailOpp, setDetailOpp] = useState<any | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState('')
  const [importPreview, setImportPreview] = useState<{
    parsed: any[]
    skipped: number
    columns: string[]
    samples: string[]
  } | null>(null)

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Poster activity
  const [posterStats, setPosterStats] = useState<{ poster: string; _count: { _all: number } }[]>([])
  const [posterLog, setPosterLog] = useState<any[]>([])
  const [showPosterPanel, setShowPosterPanel] = useState(false)

  const loadPosterActivity = useCallback(async () => {
    const res = await fetch('/api/admin/poster-activity')
    const d = await res.json()
    setPosterStats(d.totals ?? [])
    setPosterLog(d.activity ?? [])
  }, [])

  const fetchOpps = useCallback(async (p: number, q: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) })
    if (q) params.set('search', q)
    const res = await fetch(`/api/admin/opportunities?${params}`)
    const d = await res.json()
    setOpps(Array.isArray(d.data) ? d.data : [])
    setTotal(d.total ?? 0)
    setPages(d.pages ?? 1)
    setLoading(false)
  }, [])

  useEffect(() => { fetchOpps(page, search) }, [page, search, fetchOpps])

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
      setSelected(new Set())
    }, 350)
  }

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
      toast.success(editOpp ? 'Updated!' : 'Created!')
      setModalOpen(false)
      fetchOpps(page, search)
    } else {
      toast.error('Error saving opportunity')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this opportunity? This cannot be undone.')) return
    const res = await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Deleted')
      fetchOpps(page, search)
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

  // ── Excel export — fetches all records, not just current page ──
  const exportExcel = async () => {
    if (total === 0) { toast.error('No opportunities to export'); return }
    toast('Preparing export…', { icon: '⏳' })
    const res = await fetch(`/api/admin/opportunities?limit=10000`)
    const d = await res.json()
    const all: any[] = Array.isArray(d.data) ? d.data : []
    if (all.length === 0) { toast.error('No data returned'); return }
    const XLSX = await import('xlsx')
    const rows = all.map((o) => ({
      Title: o.title,
      'Host Organization': o.hostOrg,
      Country: o.country,
      'Funding Type': o.fundingType,
      Field: o.field,
      'Program Level': (o.programLevel ?? []).join(', '),
      Deadline: o.deadline ? new Date(o.deadline).toISOString().split('T')[0] : '',
      Status: o.status,
      Featured: o.featured ? 'Yes' : 'No',
      Eligibility: o.eligibility,
      'Application Link': o.applicationLink,
      Description: o.description ?? '',
      'Required Docs': (o.requiredDocs ?? []).join(', '),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Opportunities')
    XLSX.writeFile(wb, `xcel360-opportunities-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success(`Exported ${all.length} opportunities`)
  }

  // ── Excel template download ──
  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const sample = [{
      Title: 'Fulbright Foreign Student Program',
      'Host Organization': 'U.S. Department of State',
      Country: 'United States',
      'Funding Type': 'Fully funded',
      Field: 'STEM',
      'Program Level': 'Masters, PhD',
      Deadline: '2025-11-01',
      Status: 'OPEN',
      Featured: 'No',
      Eligibility: 'Open to international students with a bachelor\'s degree',
      'Application Link': 'https://foreign.fulbrightonline.org/',
      Description: 'The Fulbright Program is the U.S. government\'s flagship international educational exchange program.',
      'Required Docs': 'CV, SOP, Transcripts, References',
    }]
    const ws = XLSX.utils.json_to_sheet(sample)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Opportunities')
    XLSX.writeFile(wb, 'xcel360-import-template.xlsx')
    toast.success('Template downloaded!')
  }

  // ── Parse Excel rows into opportunity objects ──
  const parseExcelRows = (rows: any[]): { parsed: any[]; skipped: number; columns: string[] } => {
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    // Smart column finder: exact → contains → positional
    const findCol = (row: any, ...keywords: string[]): string => {
      const rowKeys = Object.keys(row)

      // 1. Exact match (case-insensitive)
      for (const kw of keywords) {
        const found = rowKeys.find(k => k.toLowerCase().trim() === kw.toLowerCase().trim())
        if (found && String(row[found]).trim()) return String(row[found]).trim()
      }

      // 2. Contains match — column name contains keyword OR keyword contains column name
      for (const kw of keywords) {
        const kwl = kw.toLowerCase()
        const found = rowKeys.find(k => {
          const kl = k.toLowerCase().trim()
          return kl.includes(kwl) || kwl.includes(kl)
        })
        if (found && String(row[found]).trim()) return String(row[found]).trim()
      }

      return ''
    }

    // Determine the title column — fallback to first column
    const titleKeywords = ['title', 'name', 'scholarship', 'program', 'opportunity', 'award', 'grant']
    const allKeys = columns.map(k => k.toLowerCase().trim())

    let titleCol = columns.find(k => {
      const kl = k.toLowerCase().trim()
      return titleKeywords.some(kw => kl.includes(kw) || kw.includes(kl))
    }) ?? columns[0] // fallback: first column

    const parseDate = (val: any): string => {
      if (!val) return new Date(Date.now() + 90 * 86400000).toISOString()
      if (val instanceof Date && !isNaN(val.getTime())) return val.toISOString()
      const str = String(val).trim()
      // Excel serial number
      if (/^\d{4,5}$/.test(str)) {
        const d = new Date(new Date(1899, 11, 30).getTime() + parseInt(str) * 86400000)
        if (!isNaN(d.getTime())) return d.toISOString()
      }
      // DD/MM/YYYY
      const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
      if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`).toISOString()
      // MM/DD/YYYY
      const mdy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
      if (mdy) return new Date(`${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`).toISOString()
      const d = new Date(str)
      return isNaN(d.getTime()) ? new Date(Date.now() + 90 * 86400000).toISOString() : d.toISOString()
    }

    const VALID_FUNDING = ['Fully funded', 'Partial', 'Tuition only', 'Living stipend only', 'Self-funded']
    const VALID_FIELDS = ['STEM', 'Arts & Humanities', 'Social Sciences', 'Business', 'Law', 'Medicine', 'Education', 'Engineering', 'Agriculture', 'Other']

    const parsed: any[] = []
    let skipped = 0

    for (const row of rows) {
      const title = titleCol ? String(row[titleCol] ?? '').trim() : ''
      if (!title) { skipped++; continue }

      // Find deadline — search for any date-like column
      const deadlineKey = Object.keys(row).find(k =>
        /deadline|due.?date|clos|end.?date|expir|apply.?by/i.test(k)
      )
      const deadline = parseDate(deadlineKey ? row[deadlineKey] : null)

      const hostOrg = findCol(row,
        'host organization', 'host org', 'organization', 'org', 'host',
        'funder', 'sponsor', 'institution', 'university', 'awarding body', 'body', 'provider'
      ) || 'Unknown'

      const appLink = findCol(row,
        'application link', 'apply link', 'link', 'url', 'apply url',
        'apply', 'application url', 'application', 'website', 'web', 'portal'
      )

      const country = findCol(row,
        'country', 'location', 'destination', 'study country', 'host country', 'nation'
      )

      const fundingRaw = findCol(row,
        'funding type', 'funding', 'scholarship type', 'award type', 'grant type', 'type'
      )

      const fieldRaw = findCol(row,
        'field', 'subject', 'discipline', 'area', 'study field', 'field of study', 'course'
      )

      const eligibility = findCol(row,
        'eligibility', 'requirements', 'criteria', 'who can apply', 'eligible', 'requirement'
      )

      const description = findCol(row,
        'description', 'about', 'details', 'summary', 'overview', 'info', 'information'
      )

      const statusRaw = findCol(row, 'status', 'availability', 'open', 'active')
      const featuredRaw = findCol(row, 'featured', 'highlight', 'featured?', 'feature')
      const levelRaw = findCol(row,
        'program level', 'level', 'study level', 'academic level', 'degree', 'degree level'
      )
      const docsRaw = findCol(row,
        'required docs', 'required documents', 'documents', 'docs', 'materials'
      )

      // Normalise funding
      let fundingType = 'Fully funded'
      if (fundingRaw) {
        const fl = fundingRaw.toLowerCase()
        if (fl.includes('partial')) fundingType = 'Partial'
        else if (fl.includes('tuition')) fundingType = 'Tuition only'
        else if (fl.includes('stipend') || fl.includes('living')) fundingType = 'Living stipend only'
        else if (fl.includes('self')) fundingType = 'Self-funded'
        else fundingType = VALID_FUNDING.find(f => f.toLowerCase().includes(fl.slice(0,4))) ?? 'Fully funded'
      }

      // Normalise field
      let field = 'STEM'
      if (fieldRaw) {
        const fl = fieldRaw.toLowerCase()
        field = VALID_FIELDS.find(f =>
          f.toLowerCase().includes(fl.slice(0,4)) || fl.includes(f.toLowerCase().slice(0,4))
        ) ?? 'STEM'
      }

      parsed.push({
        title,
        hostOrg,
        country: country || 'International',
        fundingType,
        field,
        deadline,
        eligibility: eligibility || '',
        applicationLink: appLink || '',
        description: description || '',
        programLevel: levelRaw ? levelRaw.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean) : [],
        fieldTags: [],
        requiredDocs: docsRaw
          ? docsRaw.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
          : ['CV', 'SOP', 'Transcripts'],
        status: statusRaw.toUpperCase().includes('CLOSE') ? 'CLOSED' : 'OPEN',
        featured: ['yes', 'true', '1'].includes(featuredRaw.toLowerCase()),
        views: 0,
      })
    }

    return { parsed, skipped, columns }
  }

  // ── Step 1: Read file → show preview ──
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportProgress('Reading file...')

    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })

      if (rows.length === 0) {
        toast.error('No rows found in the sheet')
        setImporting(false)
        if (xlsxInputRef.current) xlsxInputRef.current.value = ''
        return
      }

      setImportProgress(`Parsing ${rows.length} rows...`)
      const { parsed, skipped, columns } = parseExcelRows(rows)

      // Show preview modal instead of uploading directly
      setImportPreview({
        parsed,
        skipped,
        columns,
        samples: parsed.slice(0, 5).map(p => p.title),
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to read Excel file — check the format and try again')
    } finally {
      setImporting(false)
      setImportProgress('')
      if (xlsxInputRef.current) xlsxInputRef.current.value = ''
    }
  }

  // ── Step 2: Confirm upload in chunks of 200 ──
  const confirmImport = async () => {
    if (!importPreview) return
    const { parsed } = importPreview
    setImportPreview(null)
    setImporting(true)

    const CHUNK = 200
    let totalCreated = 0
    let totalFailed = 0

    for (let i = 0; i < parsed.length; i += CHUNK) {
      const chunk = parsed.slice(i, i + CHUNK)
      const progress = Math.round(((i + chunk.length) / parsed.length) * 100)
      setImportProgress(`Uploading... ${i + chunk.length} / ${parsed.length} (${progress}%)`)

      try {
        const res = await fetch('/api/admin/opportunities/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        })
        const result = await res.json()
        if (res.ok) {
          totalCreated += result.created ?? 0
          totalFailed += result.failed ?? 0
          totalFailed += result.duplicates ?? 0 // count dupes as skipped
        } else {
          totalFailed += chunk.length
        }
      } catch {
        totalFailed += chunk.length
      }
    }

    toast.success(
      `Imported ${totalCreated} opportunities` +
      (totalFailed > 0 ? ` · ${totalFailed} failed` : '') +
      (importPreview?.skipped > 0 ? ` · ${importPreview.skipped} rows had no title` : '')
    )

    setPage(1)
    fetchOpps(1, search)
    setImporting(false)
    setImportProgress('')
  }

  // ── Bulk selection ──
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(o => o.id)))
    }
  }

  const bulkAction = async (action: string) => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    const label = action === 'delete' ? `Delete ${ids.length} opportunities?` : null
    if (label && !confirm(label)) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/opportunities/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids }),
      })
      if (res.ok) {
        setSelected(new Set())
        toast.success(`Done — ${ids.length} updated`)
        fetchOpps(page, search)
      } else {
        toast.error('Bulk action failed')
      }
    } finally {
      setBulkLoading(false)
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


  // opps is already the current page from the server — no client-side filter needed
  const filtered = opps

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-500 mt-1">{total} total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setShowPosterPanel(v => !v); if (!showPosterPanel) loadPosterActivity() }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              showPosterPanel ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
            }`}
          >
            <Users className="h-4 w-4" />
            Poster Activity
          </button>
          <a
            href="https://tool.thexcel360.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-violet-200 bg-white text-violet-700 hover:bg-violet-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            AI Auto-Post
          </a>
          <button
            onClick={() => xlsxInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
            title="Import from Excel (.xlsx, .xls)"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? (importProgress || 'Importing...') : 'Import Excel'}
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            title="Download import template"
          >
            <FileCheck className="h-4 w-4" /> Template
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            title="Export to Excel"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Opportunity
          </button>
          <input
            ref={xlsxInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            className="hidden"
          />
        </div>
      </div>


      {/* ── Poster Activity Panel ── */}
      {showPosterPanel && (
        <div className="mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-700" /> Poster Activity
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Totals */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Posts by user</p>
              {posterStats.length === 0 ? (
                <p className="text-sm text-gray-400">No activity recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {posterStats.map((s) => (
                    <div key={s.poster} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center uppercase">
                        {s.poster[0]}
                      </span>
                      <span className="text-sm font-medium text-gray-700 flex-1 capitalize">{s.poster}</span>
                      <span className="text-sm font-bold text-brand-700">{s._count._all}</span>
                      <span className="text-xs text-gray-400">{s._count._all === 1 ? 'post' : 'posts'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Recent log */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent posts</p>
              {posterLog.length === 0 ? (
                <p className="text-sm text-gray-400">No activity recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {posterLog.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 text-sm">
                      <span className="capitalize font-medium text-brand-700 shrink-0 w-20 truncate">{a.poster}</span>
                      <span className="text-gray-600 flex-1 line-clamp-1">{a.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        a.category === 'JOB' ? 'bg-blue-50 text-blue-600' :
                        a.category === 'INTERNSHIP' ? 'bg-purple-50 text-purple-600' :
                        'bg-green-50 text-green-600'
                      }`}>{a.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search opportunities..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
      </div>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 bg-brand-700 text-white px-4 py-3 rounded-2xl">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => bulkAction('feature')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold transition-colors"
          >
            <Star className="h-3.5 w-3.5" /> Feature
          </button>
          <button
            onClick={() => bulkAction('unfeature')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold transition-colors"
          >
            <StarOff className="h-3.5 w-3.5" /> Unfeature
          </button>
          <button
            onClick={() => bulkAction('open')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold transition-colors"
          >
            Open
          </button>
          <button
            onClick={() => bulkAction('close')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => bulkAction('delete')}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-1 p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-brand-600 border-gray-300 cursor-pointer"
                  />
                </th>
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
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No opportunities found
                  </td>
                </tr>
              ) : (
                filtered.map((opp) => (
                  <tr key={opp.id} className={`hover:bg-gray-50 transition-colors ${selected.has(opp.id) ? 'bg-brand-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(opp.id)}
                        onChange={() => toggleSelect(opp.id)}
                        className="w-4 h-4 rounded text-brand-600 border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailOpp(opp)}
                        className="text-left group"
                      >
                        <div className="font-medium text-gray-900 line-clamp-1 group-hover:text-brand-700 transition-colors">{opp.title}</div>
                        <div className="text-xs text-gray-500">{opp.hostOrg}</div>
                      </button>
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
                          onClick={() => setDetailOpp(opp)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(opp.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
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

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">
            Page {page} of {pages} · {total} opportunities
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); setSelected(new Set()) }}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => { setPage(p => Math.min(pages, p + 1)); setSelected(new Set()) }}
              disabled={page === pages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Import Preview Modal ── */}
      {importPreview && (
        <Modal open={!!importPreview} onClose={() => setImportPreview(null)} title="Confirm Import">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-700">{importPreview.parsed.length}</p>
                <p className="text-sm text-green-600 mt-1">Ready to import</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-500">{importPreview.skipped}</p>
                <p className="text-sm text-gray-400 mt-1">Skipped (no title)</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Columns detected in your file ({importPreview.columns.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {importPreview.columns.map(col => (
                  <span key={col} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {importPreview.parsed.length === 0 ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-1">No rows could be parsed</p>
                <p className="text-xs text-red-600">
                  The importer couldn&apos;t find a title column. Please rename your title column to
                  &ldquo;Title&rdquo;, &ldquo;Scholarship Title&rdquo;, or &ldquo;Name&rdquo;, or download the template for the exact format.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Sample titles (first 5)
                </p>
                <ul className="space-y-1">
                  {importPreview.samples.map((t, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-300 shrink-0">#{i + 1}</span>
                      <span className="line-clamp-1">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.skipped > 50 && importPreview.parsed.length < 50 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                Many rows were skipped. If this looks wrong, download the <button onClick={downloadTemplate} className="underline font-semibold">import template</button> and make sure your title column matches.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setImportPreview(null)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importPreview.parsed.length === 0}
                className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-50 transition-colors"
              >
                Import {importPreview.parsed.length} Opportunities
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Detail View Modal ── */}
      {detailOpp && (
        <Modal
          open={!!detailOpp}
          onClose={() => setDetailOpp(null)}
          title="Opportunity Details"
          size="lg"
        >
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${detailOpp.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {detailOpp.status}
                </span>
                {detailOpp.featured && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700">
                    Featured
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-brand-50 text-brand-700">
                  {detailOpp.fundingType}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{detailOpp.title}</h2>
            </div>

            {/* Info grid */}
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Host</p>
                  <p className="text-gray-800 font-medium">{detailOpp.hostOrg}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Country</p>
                  <p className="text-gray-800">{detailOpp.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Deadline</p>
                  <p className="text-gray-800">{detailOpp.deadline ? formatDate(detailOpp.deadline) : '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Field</p>
                  <p className="text-gray-800">{detailOpp.field}</p>
                </div>
              </div>
            </div>

            {/* Program levels */}
            {detailOpp.programLevel?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Program Level</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailOpp.programLevel.map((l: string) => (
                    <span key={l} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility */}
            {detailOpp.eligibility && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">Eligibility</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{detailOpp.eligibility}</p>
              </div>
            )}

            {/* Description */}
            {detailOpp.description && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 whitespace-pre-line">{detailOpp.description}</p>
              </div>
            )}

            {/* Required docs */}
            {detailOpp.requiredDocs?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Required Documents</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailOpp.requiredDocs.map((d: string) => (
                    <span key={d} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      <FileCheck className="h-3 w-3" />{d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setDetailOpp(null); openEdit(detailOpp) }}
                className="flex items-center gap-2 flex-1 justify-center py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors"
              >
                <Pencil className="h-4 w-4" /> Edit Opportunity
              </button>
              {detailOpp.applicationLink && (
                <a
                  href={detailOpp.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> Apply Link
                </a>
              )}
            </div>
          </div>
        </Modal>
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
