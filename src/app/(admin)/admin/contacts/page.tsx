'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Search, Trash2, Users, X, Loader2, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

// xlsx is heavy (~400KB) - loaded on demand inside import/export handlers
// instead of shipping with the page bundle.
type XLSXModule = typeof import('xlsx')

type Contact = { id: string; email: string; name?: string; source: string; createdAt: string }
type Breakdown = { source: string; _count: { _all: number } }

const SOURCE_LABELS: Record<string, string> = {
  import:     'Excel Import',
  event:      'Event Registration',
  user:       'Platform User',
  subscriber: 'Newsletter',
  manual:     'Manual',
}
const SOURCE_COLORS: Record<string, string> = {
  import:     'bg-blue-100 text-blue-700',
  event:      'bg-purple-100 text-purple-700',
  user:       'bg-green-100 text-green-700',
  subscriber: 'bg-orange-100 text-orange-700',
  manual:     'bg-gray-100 text-gray-600',
}

// ── Preview modal shown before import ────────────────────────────────────────
function PreviewModal({
  rows, filename, onConfirm, onCancel, importing,
}: {
  rows: { email: string; name?: string }[]
  filename: string
  onConfirm: () => void
  onCancel: () => void
  importing: boolean
}) {
  const preview = rows.slice(0, 8)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Import Preview</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filename} · {rows.length.toLocaleString()} contacts found</p>
          </div>
          <button onClick={onCancel} disabled={importing} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2 font-semibold">Name</th>
                <th className="text-left pb-2 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700 pr-4">{r.name || <span className="text-gray-300 italic"> - </span>}</td>
                  <td className="py-2 text-gray-500 text-xs">{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 8 && (
            <p className="text-xs text-gray-400 mt-3 text-center">and {(rows.length - 8).toLocaleString()} more…</p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onCancel} disabled={importing}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={importing}
            className="flex-1 py-2.5 bg-ink-900 text-white rounded-xl text-sm font-semibold hover:bg-ink-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : `Import ${rows.length.toLocaleString()} Contacts`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminContactsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [contacts, setContacts]     = useState<Contact[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [pages, setPages]           = useState(1)
  const [breakdown, setBreakdown]   = useState<Breakdown[]>([])
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [deleting, setDeleting]     = useState<string | null>(null)

  // Excel preview state
  const [previewRows, setPreviewRows]   = useState<{ email: string; name?: string }[] | null>(null)
  const [previewFile, setPreviewFile]   = useState('')
  const [importing, setImporting]       = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (search)       params.set('q', search)
      if (sourceFilter) params.set('source', sourceFilter)
      const res = await fetch(`/api/admin/contacts?${params}`)
      const d = await res.json()
      setContacts(d.contacts ?? [])
      setTotal(d.total ?? 0)
      setPage(d.page ?? 1)
      setPages(d.pages ?? 1)
      setBreakdown(d.breakdown ?? [])
    } finally { setLoading(false) }
  }, [search, sourceFilter])

  useEffect(() => { load(1) }, [load])

  // ── Parse Excel file in browser ───────────────────────────────────────────
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX: XLSXModule = await import('xlsx')
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb   = XLSX.read(data, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (json.length === 0) { toast.error('No rows found in the file'); return }

        // Auto-detect columns (case-insensitive)
        const keys = Object.keys(json[0])
        const emailKey = keys.find(k => /email/i.test(k))
        const nameKey  = keys.find(k => /name/i.test(k))

        if (!emailKey) { toast.error('No "Email" column found. Make sure row 1 has a column called Email.'); return }

        const rows = json
          .map(row => ({
            email: String(row[emailKey] ?? '').toLowerCase().trim(),
            name:  nameKey ? String(row[nameKey] ?? '').trim() || undefined : undefined,
          }))
          .filter(r => r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))

        if (rows.length === 0) { toast.error('No valid email addresses found'); return }

        setPreviewRows(rows)
        setPreviewFile(file.name)
      } catch {
        toast.error('Could not read file  -  make sure it is a valid .xlsx or .xls file')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImportConfirm = async () => {
    if (!previewRows) return
    setImporting(true)
    try {
      const res = await fetch('/api/admin/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: previewRows, source: 'import' }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? 'Import failed'); return }
      toast.success(`Done! ${d.created} new · ${d.updated} updated`)
      setPreviewRows(null)
      load(1)
    } catch { toast.error('Something went wrong') }
    finally { setImporting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this contact?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/admin/contacts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (res.ok) { toast.success('Removed'); load(page) }
      else toast.error('Delete failed')
    } finally { setDeleting(null) }
  }

  // ── Export to CSV ─────────────────────────────────────────────────────────
  const handleExport = async () => {
    const XLSX: XLSXModule = await import('xlsx')
    const res = await fetch('/api/admin/contacts?page=1')
    // Fetch all pages
    const first = await res.json()
    let all = first.contacts as Contact[]
    for (let p = 2; p <= first.pages; p++) {
      const r = await fetch(`/api/admin/contacts?page=${p}`)
      const d = await r.json()
      all = [...all, ...d.contacts]
    }
    const ws = XLSX.utils.json_to_sheet(all.map(c => ({ Name: c.name ?? '', Email: c.email, Source: SOURCE_LABELS[c.source] ?? c.source, Added: new Date(c.createdAt).toLocaleDateString('en-GB') })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
    XLSX.writeFile(wb, `xcel360-contacts-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const totalBreakdown = breakdown.reduce((s, b) => s + b._count._all, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Contacts</h1>
          <p className="text-gray-500 mt-1">Master email list  -  {total.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-ink-900 text-white rounded-xl text-sm font-semibold hover:bg-ink-800 transition-colors">
            <Upload className="h-4 w-4" /> Import Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = '' } }} />
        </div>
      </div>

      {/* Source breakdown chips */}
      {breakdown.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setSourceFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!sourceFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All · {total.toLocaleString()}
          </button>
          {breakdown.map(b => (
            <button key={b.source} onClick={() => setSourceFilter(b.source === sourceFilter ? '' : b.source)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${sourceFilter === b.source ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {SOURCE_LABELS[b.source] ?? b.source} · {b._count._all}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-10 w-10 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">
              {search || sourceFilter ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            {!search && !sourceFilter && (
              <button onClick={() => fileRef.current?.click()} className="mt-4 text-brand-700 text-sm font-medium">
                Import your first Excel file →
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{c.name || <span className="text-gray-300 italic text-xs">No name</span>}</td>
                    <td className="px-5 py-3 text-gray-500">{c.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[c.source] ?? 'bg-gray-100 text-gray-600'}`}>
                        {SOURCE_LABELS[c.source] ?? c.source}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded disabled:opacity-50">
                        {deleting === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400">Page {page} of {pages} · {total.toLocaleString()} contacts</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => load(page - 1)} disabled={page <= 1 || loading}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => load(page + 1)} disabled={page >= pages || loading}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import preview modal */}
      {previewRows && (
        <PreviewModal
          rows={previewRows}
          filename={previewFile}
          onConfirm={handleImportConfirm}
          onCancel={() => setPreviewRows(null)}
          importing={importing}
        />
      )}
    </div>
  )
}
