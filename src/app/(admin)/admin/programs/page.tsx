'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Users, BookOpen, ChevronDown, ChevronUp, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

const emptyProgram = {
  title: '', cohortNumber: '', description: '', focus: '',
  startDate: '', endDate: '', participants: '', published: true,
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [beneficiaries, setBeneficiaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [programModal, setProgramModal] = useState(false)
  const [editProgram, setEditProgram] = useState<any>(null)
  const [form, setForm] = useState(emptyProgram)
  const [saving, setSaving] = useState(false)

  // Beneficiary bulk add state
  const [selectedProgram, setSelectedProgram] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [bulkPanel, setBulkPanel] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)

  // Single add beneficiary
  const [bForm, setBForm] = useState({ firstName: '', department: '', school: '', programId: '' })
  const [bModal, setBModal] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/programs').then(r => r.json()),
      fetch('/api/admin/beneficiaries').then(r => r.json()),
    ]).then(([progs, bens]) => {
      setPrograms(Array.isArray(progs) ? progs : [])
      setBeneficiaries(Array.isArray(bens) ? bens : [])
      setLoading(false)
    })
  }, [])

  const openAdd = () => { setEditProgram(null); setForm(emptyProgram); setProgramModal(true) }
  const openEdit = (p: any) => {
    setEditProgram(p)
    setForm({
      title: p.title, cohortNumber: p.cohortNumber ?? '',
      description: p.description, focus: p.focus,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      participants: p.participants, published: p.published,
    })
    setProgramModal(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.startDate) { toast.error('Title and start date are required'); return }
    setSaving(true)
    const url = editProgram ? `/api/admin/programs/${editProgram.id}` : '/api/admin/programs'
    const method = editProgram ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const updated = await res.json()
      if (editProgram) setPrograms(p => p.map(x => x.id === updated.id ? { ...x, ...updated } : x))
      else setPrograms(p => [updated, ...p])
      toast.success(editProgram ? 'Updated!' : 'Program created!')
      setProgramModal(false)
    } else { toast.error('Error saving') }
    setSaving(false)
  }

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Delete this program and all its beneficiaries?')) return
    const res = await fetch(`/api/admin/programs/${id}`, { method: 'DELETE' })
    if (res.ok) { setPrograms(p => p.filter(x => x.id !== id)); toast.success('Deleted') }
  }

  const handleAddBeneficiary = async () => {
    if (!bForm.firstName) { toast.error('First name required'); return }
    const res = await fetch('/api/admin/beneficiaries', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bForm),
    })
    if (res.ok) {
      const b = await res.json()
      setBeneficiaries(prev => [b, ...prev])
      toast.success('Beneficiary added!')
      setBModal(false)
      setBForm({ firstName: '', department: '', school: '', programId: '' })
    } else { toast.error('Error adding beneficiary') }
  }

  const handleDeleteBeneficiary = async (id: string) => {
    const res = await fetch(`/api/admin/beneficiaries/${id}`, { method: 'DELETE' })
    if (res.ok) { setBeneficiaries(p => p.filter(x => x.id !== id)); toast.success('Removed') }
  }

  // Bulk import: one name per line, format: "FirstName, Department, School"
  const handleBulkImport = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast.error('No names entered'); return }
    setBulkSaving(true)
    let added = 0
    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim())
      const payload = {
        firstName: parts[0],
        department: parts[1] || null,
        school: parts[2] || null,
        programId: selectedProgram || null,
      }
      if (!payload.firstName) continue
      const res = await fetch('/api/admin/beneficiaries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) { const b = await res.json(); setBeneficiaries(p => [b, ...p]); added++ }
    }
    toast.success(`Added ${added} beneficiaries!`)
    setBulkText(''); setBulkPanel(false)
    setBulkSaving(false)
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-10">
      {/* Programs section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programs & Cohorts</h1>
            <p className="text-gray-500 mt-1">{programs.length} programs · {beneficiaries.length} beneficiaries total</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors">
            <Plus className="h-4 w-4" /> Add Program
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                  {p.cohortNumber ? `Cohort ${p.cohortNumber}` : 'Program'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 text-xs font-medium hover:text-gray-700 transition-colors">Edit</button>
                  <button onClick={() => handleDeleteProgram(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{p.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.focus}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {p._count?.beneficiaries ?? 0} beneficiaries added
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beneficiaries section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Beneficiaries</h2>
            <p className="text-gray-500 text-sm mt-0.5">First names only — shown publicly in scrolling display</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkPanel(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${bulkPanel ? 'bg-violet-700 text-white border-violet-700' : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'}`}
            >
              <Upload className="h-4 w-4" />
              Bulk Import
              {bulkPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => { setBForm({ firstName: '', department: '', school: '', programId: '' }); setBModal(true) }} className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors">
              <Plus className="h-4 w-4" /> Add One
            </button>
          </div>
        </div>

        {/* Bulk import panel */}
        {bulkPanel && (
          <div className="mb-6 bg-violet-50 border border-violet-100 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Bulk Import Beneficiaries</h3>
            <p className="text-sm text-gray-500 mb-3">
              One person per line. Format: <code className="bg-white px-1 rounded text-xs">FirstName, Department, School</code>
            </p>
            <select
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-violet-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">— No program (general) —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <textarea
              rows={8}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"Amara, Engineering, University of Lagos\nFatima, Medicine, UNILAG\nChris, Law, ABU Zaria"}
              className="w-full px-3 py-2.5 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono resize-none mb-3"
            />
            <div className="flex gap-3">
              <button onClick={handleBulkImport} disabled={bulkSaving || !bulkText.trim()} className="flex items-center gap-2 bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-800 disabled:opacity-50 transition-colors">
                {bulkSaving ? 'Importing...' : `Import ${bulkText.split('\n').filter(l => l.trim()).length} names`}
              </button>
              <button onClick={() => { setBulkPanel(false); setBulkText('') }} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Beneficiaries table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">First Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">School</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Program</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {beneficiaries.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No beneficiaries yet — add some above</td></tr>
              ) : beneficiaries.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{b.firstName}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{b.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{b.school || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {b.program ? (
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{b.program.cohortNumber ? `Cohort ${b.program.cohortNumber}` : b.program.title}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteBeneficiary(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Program modal */}
      <Modal open={programModal} onClose={() => setProgramModal(false)} title={editProgram ? 'Edit Program' : 'Add Program'} size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Program Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Cohort 1 — Scholarship Mentorship" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cohort Number</label>
              <input type="number" value={form.cohortNumber} onChange={e => setForm(f => ({ ...f, cohortNumber: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="1, 2, 3..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Focus Area</label>
              <input value={form.focus} onChange={e => setForm(f => ({ ...f, focus: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Scholarship Applications & SOP Writing" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="What this cohort covered..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setProgramModal(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60">{saving ? 'Saving...' : editProgram ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      {/* Single beneficiary modal */}
      <Modal open={bModal} onClose={() => setBModal(false)} title="Add Beneficiary">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
            <input value={bForm.firstName} onChange={e => setBForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Amara" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <input value={bForm.department} onChange={e => setBForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Engineering" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">School</label>
            <input value={bForm.school} onChange={e => setBForm(f => ({ ...f, school: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. University of Lagos" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Program (optional)</label>
            <select value={bForm.programId} onChange={e => setBForm(f => ({ ...f, programId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">— General / No program —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setBModal(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleAddBeneficiary} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800">Add</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
