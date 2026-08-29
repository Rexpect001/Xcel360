'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, ChevronDown, User, Mail, Phone, BookOpen, MapPin,
  KeyRound, X, Loader2, Shield, CheckCircle2, Trash2,
  UserCheck, UserX, AlertTriangle, Clock, CheckSquare2, Pencil,
  TrendingUp, Users, UserPlus, CalendarDays,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { ROLE_LABELS, type UserRole } from '@/lib/permissions'
import Modal from '@/components/ui/Modal'

// recharts is heavy - split into a separate chunk loaded on demand
const GrowthChart = dynamic(() => import('./GrowthChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
    </div>
  ),
})

const ALL_ROLES: UserRole[] = ['USER', 'EDITOR', 'MODERATOR', 'MENTOR', 'MANAGER', 'ADMIN']

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  SIGNUP: 'bg-blue-100 text-blue-700',
  CREATE: 'bg-brand-100 text-brand-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PUBLISH: 'bg-purple-100 text-purple-700',
  ASSIGN_ROLE: 'bg-orange-100 text-orange-700',
  LOGIN_FAILED: 'bg-red-100 text-red-600',
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:    { label: 'Active',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  SUSPENDED: { label: 'Suspended', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  DISABLED:  { label: 'Disabled',  color: 'bg-red-100 text-red-600',      dot: 'bg-red-500' },
}

type Stats = {
  total: number; active: number; suspended: number; disabled: number
  newToday: number; newThisWeek: number; newThisMonth: number
  daily: { date: string; users: number }[]
  monthly: { month: string; users: number }[]
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  // ── Stats ────────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [chartMode, setChartMode] = useState<'daily' | 'monthly'>('daily')

  // ── User list ────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersVisible, setUsersVisible] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [detailUser, setDetailUser] = useState<any | null>(null)
  const [detailData, setDetailData] = useState<{ user: any; activityLog: any[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile')
  const [pwModal, setPwModal] = useState<{ userId: string; userName: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [editModal, setEditModal] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', school: '', department: '', level: '', whatsappNumber: '', bio: '', targetCountries: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [purgePreview, setPurgePreview] = useState<{ count: number; cutoff: string } | null>(null)
  const [purging, setPurging] = useState(false)
  const [showPurgeModal, setShowPurgeModal] = useState(false)

  // ── Fetch stats on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/users/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setStatsLoading(false) })
      .catch(() => setStatsLoading(false))
  }, [])

  // ── Fetch users ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (q: string, all = false) => {
    setUsersLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (all) params.set('all', '1')
    const res = await fetch(`/api/admin/users?${params}`)
    const d = await res.json()
    setUsers(Array.isArray(d) ? d : [])
    setUsersLoading(false)
    setUsersVisible(true)
  }, [])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!val.trim()) { setUsers([]); setUsersVisible(false); return }
    searchTimer.current = setTimeout(() => fetchUsers(val), 350)
  }

  const showAll = () => fetchUsers('', true)

  // ── Filtered (client-side role/status after server fetch) ────────────────────
  const filtered = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus && (u.status ?? 'ACTIVE') !== filterStatus) return false
    return true
  })

  const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelected(p => p.size === filtered.length ? new Set() : new Set(filtered.map(u => u.id)))

  // ── User actions ─────────────────────────────────────────────────────────────
  const deleteUser = async (user: any) => {
    if (!confirm(`Permanently delete ${user.name || user.email}? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(p => p.filter(u => u.id !== user.id))
      if (detailUser?.id === user.id) setDetailUser(null)
      toast.success('User deleted')
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Delete failed')
    }
  }

  const bulkAction = async (action: string) => {
    const ids = Array.from(selected)
    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} user(s)? This cannot be undone.`)) return
    const res = await fetch('/api/admin/users/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, action }) })
    if (res.ok) {
      if (action === 'delete') setUsers(p => p.filter(u => !selected.has(u.id)))
      else {
        const statusMap: Record<string, string> = { suspend: 'SUSPENDED', disable: 'DISABLED', activate: 'ACTIVE' }
        const newStatus = statusMap[action]
        setUsers(p => p.map(u => selected.has(u.id) ? { ...u, status: newStatus } : u))
      }
      setSelected(new Set())
      toast.success(`Done  -  ${ids.length} user(s) updated`)
    } else toast.error('Action failed')
  }

  const changeRole = async (user: any, newRole: UserRole) => {
    if (newRole === user.role) return
    const label = ROLE_LABELS[newRole]?.label ?? newRole
    if (!confirm(`Change ${user.name || user.email}'s role to ${label}?`)) return
    setUpdatingId(user.id)
    const res = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setUpdatingId(null)
    if (res.ok) {
      const updated = await res.json()
      setUsers(p => p.map(u => u.id === updated.id ? { ...u, role: updated.role } : u))
      if (detailData?.user?.id === updated.id) setDetailData(d => d ? { ...d, user: { ...d.user, role: updated.role } } : d)
      toast.success(`Role updated to ${label}`)
    } else toast.error('Failed to update role')
  }

  const changeStatus = async (user: any, newStatus: string) => {
    if ((user.status ?? 'ACTIVE') === newStatus) return
    setUpdatingId(user.id)
    const res = await fetch(`/api/admin/users/${user.id}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setUpdatingId(null)
    if (res.ok) {
      setUsers(p => p.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
      if (detailData?.user?.id === user.id) setDetailData(d => d ? { ...d, user: { ...d.user, status: newStatus } } : d)
      toast.success(`User ${STATUS_META[newStatus]?.label.toLowerCase() ?? newStatus}`)
    } else toast.error('Failed to update status')
  }

  const openDetail = async (user: any) => {
    setDetailUser(user); setDetailData(null); setDetailLoading(true); setActiveTab('profile')
    const res = await fetch(`/api/admin/users/${user.id}/detail`)
    if (res.ok) setDetailData(await res.json())
    setDetailLoading(false)
  }

  const openEditUser = (user: any) => {
    const p = detailData?.user?.profile ?? {}
    setEditForm({ name: user.name ?? '', email: user.email ?? '', school: p.school ?? '', department: p.department ?? '', level: p.level ?? '', whatsappNumber: p.whatsappNumber ?? '', bio: p.bio ?? '', targetCountries: (p.targetCountries ?? []).join(', ') })
    setEditModal(user)
  }

  const handleEditSave = async () => {
    if (!editModal) return
    if (!editForm.name.trim()) { toast.error('Name is required'); return }
    if (!editForm.email.trim()) { toast.error('Email is required'); return }
    setEditSaving(true)
    const res = await fetch(`/api/admin/users/${editModal.id}/edit`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, targetCountries: editForm.targetCountries.split(',').map((s: string) => s.trim()).filter(Boolean) }),
    })
    setEditSaving(false)
    if (res.ok) {
      setUsers(p => p.map(u => u.id === editModal.id ? { ...u, name: editForm.name, email: editForm.email } : u))
      toast.success('User updated'); setEditModal(null)
    } else { const d = await res.json(); toast.error(d.error ?? 'Failed to save') }
  }

  const handleResetPassword = async () => {
    if (!pwModal || newPassword.length < 8) return
    setPwSaving(true)
    const res = await fetch(`/api/admin/users/${pwModal.userId}/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }),
    })
    if (res.ok) { toast.success(`Password reset for ${pwModal.userName}`); setPwModal(null); setNewPassword('') }
    else { const d = await res.json(); toast.error(d.error ?? 'Failed to reset password') }
    setPwSaving(false)
  }

  const previewPurge = async () => {
    const res = await fetch('/api/admin/users/purge-inactive')
    if (res.ok) { setPurgePreview(await res.json()); setShowPurgeModal(true) }
  }

  const executePurge = async () => {
    setPurging(true)
    const res = await fetch('/api/admin/users/purge-inactive', { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      toast.success(`Removed ${d.deleted} inactive user${d.deleted !== 1 ? 's' : ''}`)
      setShowPurgeModal(false)
      fetch('/api/admin/users/stats').then(r => r.json()).then(setStats)
      if (usersVisible) fetchUsers(search, !search)
    } else toast.error('Purge failed')
    setPurging(false)
  }

  // ── Chart data ───────────────────────────────────────────────────────────────
  const chartData = chartMode === 'daily'
    ? (stats?.daily ?? []).map(d => ({
        label: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        key: d.date,
        users: d.users,
      }))
    : (stats?.monthly ?? []).map(m => ({
        label: new Date(m.month + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        key: m.month,
        users: m.users,
      }))

  const totalNewInChart = chartData.reduce((s, d) => s + d.users, 0)

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          {stats && <p className="text-gray-500 mt-1">{stats.total.toLocaleString()} total · {stats.active.toLocaleString()} active</p>}
        </div>
        <button onClick={previewPurge}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100">
          <Trash2 className="h-4 w-4" /> Remove Inactive (2+ yrs)
        </button>
      </div>

      {/* ── Stat cards ── */}
      {statsLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0,1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Users" value={stats.total} icon={Users} color="bg-brand-50 text-brand-700" />
          <StatCard label="Active Users" value={stats.active} sub={stats.suspended > 0 ? `${stats.suspended} suspended` : undefined} icon={UserCheck} color="bg-green-50 text-green-700" />
          <StatCard label="New This Month" value={stats.newThisMonth} sub={`+${stats.newThisWeek} this week`} icon={UserPlus} color="bg-sky-50 text-sky-700" />
          <StatCard label="Joined Today" value={stats.newToday} icon={CalendarDays} color="bg-purple-50 text-purple-700" />
        </div>
      )}

      {/* ── Growth chart ── */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" /> User Growth
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalNewInChart.toLocaleString()} new user{totalNewInChart !== 1 ? 's' : ''} in the {chartMode === 'daily' ? 'last 30 days' : 'last 12 months'}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {(['daily', 'monthly'] as const).map(m => (
                <button key={m} onClick={() => setChartMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${chartMode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {m === 'daily' ? '30 Days' : '12 Months'}
                </button>
              ))}
            </div>
          </div>
          <GrowthChart data={chartData} mode={chartMode} />
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
          {search && (
            <button onClick={() => { setSearch(''); setUsers([]); setUsersVisible(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DISABLED">Disabled</option>
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
        </select>
      </div>

      {/* ── Show all prompt (when no search and list not shown) ── */}
      {!usersVisible && !usersLoading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <Users className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium text-sm">Search above to find a specific user</p>
          <p className="text-gray-400 text-xs mt-1 mb-4">or load the full list to browse</p>
          <button onClick={showAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors">
            Show all {stats?.total ?? ''} users
          </button>
        </div>
      )}

      {usersLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 text-brand-700 animate-spin" />
        </div>
      )}

      {/* ── Bulk bar ── */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 bg-brand-700 text-white px-5 py-3 rounded-2xl shadow-lg">
          <CheckSquare2 className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold flex-1">{selected.size} selected</span>
          <button onClick={() => bulkAction('activate')} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium">Activate</button>
          <button onClick={() => bulkAction('suspend')} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium">Suspend</button>
          <button onClick={() => bulkAction('disable')} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium">Disable</button>
          <button onClick={() => bulkAction('delete')} className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg font-medium">Delete</button>
          <button onClick={() => setSelected(new Set())} className="p-1 hover:bg-white/20 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── User table ── */}
      {usersVisible && !usersLoading && (
        <>
          <p className="text-sm text-gray-500 mb-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''} shown</p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-brand-600 border-gray-300 cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Last Login</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No users found</td></tr>
                ) : filtered.map((user) => {
                  const roleKey = (user.role ?? 'USER') as UserRole
                  const roleMeta = ROLE_LABELS[roleKey] ?? ROLE_LABELS['USER']
                  const status = user.status ?? 'ACTIVE'
                  const statusMeta = STATUS_META[status]
                  const isUpdating = updatingId === user.id
                  return (
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${status === 'DISABLED' ? 'opacity-60' : ''} ${selected.has(user.id) ? 'bg-brand-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelect(user.id)} className="w-4 h-4 rounded text-brand-600 border-gray-300 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(user)} className="flex items-center gap-3 text-left group">
                          <div className="relative">
                            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                              {user.name?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? 'U'}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusMeta.dot}`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">{user.name ?? ' - '}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.color}`}>{statusMeta.label}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMeta.color}`}>{roleMeta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {user.lastLoginAt
                          ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(user.lastLoginAt)}</span>
                          : <span className="text-gray-300">Never</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {status !== 'ACTIVE' && <button onClick={() => changeStatus(user, 'ACTIVE')} disabled={isUpdating} title="Reactivate" className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"><UserCheck className="h-4 w-4" /></button>}
                          {status !== 'SUSPENDED' && <button onClick={() => changeStatus(user, 'SUSPENDED')} disabled={isUpdating} title="Suspend" className="p-1.5 rounded-lg text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"><AlertTriangle className="h-4 w-4" /></button>}
                          {status !== 'DISABLED' && <button onClick={() => changeStatus(user, 'DISABLED')} disabled={isUpdating} title="Disable" className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><UserX className="h-4 w-4" /></button>}
                          <button onClick={() => setPwModal({ userId: user.id, userName: user.name || user.email })} title="Reset password" className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"><KeyRound className="h-4 w-4" /></button>
                          <button onClick={() => deleteUser(user)} title="Delete user" className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          <div className="relative">
                            <select value={user.role ?? 'USER'} disabled={isUpdating} onChange={e => changeRole(user, e.target.value as UserRole)}
                              className="appearance-none text-xs pl-2.5 pr-7 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-50 hover:border-gray-300 transition-colors">
                              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── User Detail Modal ── */}
      {detailUser && (
        <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title="User Profile" size="lg">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl flex-shrink-0">
                {detailUser.name?.charAt(0)?.toUpperCase() ?? detailUser.email?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{detailUser.name ?? 'No name'}</h2>
                <p className="text-sm text-gray-500">{detailUser.email}</p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  {(() => { const k = (detailData?.user?.role ?? detailUser.role ?? 'USER') as UserRole; const m = ROLE_LABELS[k] ?? ROLE_LABELS['USER']; return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.color}`}>{m.label}</span> })()}
                  {(() => { const s = detailData?.user?.status ?? detailUser.status ?? 'ACTIVE'; const sm = STATUS_META[s]; return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sm.color}`}>{sm.label}</span> })()}
                  {detailData?.user?.emailVerified && <span className="text-xs text-green-600 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Verified</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button onClick={() => openEditUser(detailData?.user ?? detailUser)} className="flex items-center gap-1.5 px-3 py-2 bg-brand-50 text-brand-700 rounded-xl text-xs font-semibold hover:bg-brand-100 transition-colors"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => { setDetailUser(null); setPwModal({ userId: detailUser.id, userName: detailUser.name || detailUser.email }) }} className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-semibold hover:bg-orange-100 transition-colors"><KeyRound className="h-3.5 w-3.5" /> Reset PW</button>
                <button onClick={() => { setDetailUser(null); deleteUser(detailUser) }} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>

            {detailData && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 w-full mb-1 font-medium">Account Status</p>
                {(['ACTIVE', 'SUSPENDED', 'DISABLED'] as const).map(s => {
                  const sm = STATUS_META[s]; const isCurrent = (detailData.user.status ?? 'ACTIVE') === s
                  return (
                    <button key={s} onClick={() => changeStatus(detailData.user, s)} disabled={isCurrent || updatingId === detailData.user.id}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-60 ${isCurrent ? `${sm.color} border-current` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {s === 'ACTIVE' && <UserCheck className="h-3 w-3" />}{s === 'SUSPENDED' && <AlertTriangle className="h-3 w-3" />}{s === 'DISABLED' && <UserX className="h-3 w-3" />}
                      {sm.label}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-gray-800">{detailUser._count?.savedOpps ?? 0}</p><p className="text-xs text-gray-400 mt-0.5">Saved</p></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-gray-800">{detailUser._count?.applications ?? 0}</p><p className="text-xs text-gray-400 mt-0.5">Applications</p></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs font-medium text-gray-600 mt-1">{formatDate(detailUser.createdAt)}</p><p className="text-xs text-gray-400 mt-0.5">Joined</p></div>
            </div>

            {detailData?.user?.lastLoginAt && <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />Last login: {formatDate(detailData.user.lastLoginAt)}</p>}

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(['profile', 'activity'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab === 'profile' ? 'Profile Info' : 'Activity Log'}
                </button>
              ))}
            </div>

            {detailLoading ? <div className="flex justify-center py-8"><Loader2 className="h-7 w-7 text-brand-700 animate-spin" /></div> : (
              <>
                {activeTab === 'profile' && detailData && (
                  <div className="space-y-3">
                    {[
                      { icon: Mail, label: 'Email', value: detailData.user.email },
                      { icon: User, label: 'Full Name', value: detailData.user.name },
                      { icon: BookOpen, label: 'School', value: detailData.user.profile?.school },
                      { icon: BookOpen, label: 'Department', value: detailData.user.profile?.department },
                      { icon: Shield, label: 'Level', value: detailData.user.profile?.level },
                      { icon: Phone, label: 'WhatsApp', value: detailData.user.profile?.whatsappNumber },
                      { icon: MapPin, label: 'Target Countries', value: detailData.user.profile?.targetCountries?.join(', ') },
                    ].map(({ icon: Icon, label, value }) => value ? (
                      <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                        <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div><p className="text-xs text-gray-400">{label}</p><p className="text-sm text-gray-800 font-medium">{value}</p></div>
                      </div>
                    ) : null)}
                    {detailData.user.profile?.bio && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Bio</p><p className="text-sm text-gray-700 leading-relaxed">{detailData.user.profile.bio}</p></div>}
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 mb-2">Change Role</p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_ROLES.map(r => {
                          const meta = ROLE_LABELS[r]; const isCurrent = (detailData.user.role ?? 'USER') === r
                          return <button key={r} onClick={() => changeRole(detailData.user, r)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${isCurrent ? `${meta.color} border-current` : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>{meta.label}</button>
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'activity' && detailData && (
                  detailData.activityLog.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">No activity logged yet.</div> : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {detailData.activityLog.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>{log.action}</span>
                          <div className="flex-1 min-w-0"><p className="text-sm text-gray-700">{log.resource && <span className="text-gray-400">{log.resource}: </span>}<span className="font-medium">{log.resourceName ?? log.details ?? ' - '}</span></p></div>
                          <p className="text-xs text-gray-400 shrink-0">{new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ── Password Reset Modal ── */}
      {pwModal && (
        <Modal open={!!pwModal} onClose={() => { setPwModal(null); setNewPassword('') }} title="Reset Password">
          <div className="space-y-5">
            <p className="text-sm text-gray-500">Set a new password for <span className="font-semibold text-gray-800">{pwModal.userName}</span>.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-16" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">{showPw ? 'Hide' : 'Show'}</button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && <p className="text-xs text-red-500 mt-1">Must be at least 8 characters</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPwModal(null); setNewPassword('') }} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleResetPassword} disabled={pwSaving || newPassword.length < 8}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><KeyRound className="h-4 w-4" /> Reset Password</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit User Modal ── */}
      {editModal && (
        <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit User Details" size="lg">
          <div className="space-y-4">
            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">Changes here update the user&apos;s account details and profile.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[{ label: 'Full Name *', icon: User, key: 'name', placeholder: 'Full name', type: 'text' },
                { label: 'Email *', icon: Mail, key: 'email', placeholder: 'email@example.com', type: 'email' },
                { label: 'School / University', icon: BookOpen, key: 'school', placeholder: 'e.g. University of Lagos', type: 'text' },
                { label: 'Department', icon: BookOpen, key: 'department', placeholder: 'e.g. Computer Science', type: 'text' },
                { label: 'Level / Year', icon: Shield, key: 'level', placeholder: 'e.g. 300 Level / Masters', type: 'text' },
                { label: 'WhatsApp Number', icon: Phone, key: 'whatsappNumber', placeholder: '+234 800 000 0000', type: 'text' },
              ].map(({ label, icon: Icon, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type={type} value={(editForm as any)[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Target Countries <span className="text-gray-400">(comma separated)</span></label>
              <input value={editForm.targetCountries} onChange={e => setEditForm(f => ({ ...f, targetCountries: e.target.value }))} placeholder="e.g. UK, Canada, USA" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Bio / About</label>
              <textarea rows={3} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short bio..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditModal(null)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving} className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {editSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Pencil className="h-4 w-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Purge Inactive Modal ── */}
      {showPurgeModal && purgePreview && (
        <Modal open={showPurgeModal} onClose={() => setShowPurgeModal(false)} title="Remove Inactive Users">
          <div className="space-y-5">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">This action is permanent</p>
                  <p className="text-sm text-red-600 mt-1">
                    {purgePreview.count === 0 ? 'No inactive users found.' : `${purgePreview.count} user${purgePreview.count !== 1 ? 's' : ''} will be permanently deleted.`}
                  </p>
                  <p className="text-xs text-red-400 mt-1">Criteria: role = USER, no login since {new Date(purgePreview.cutoff).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPurgeModal(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={executePurge} disabled={purging || purgePreview.count === 0} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {purging ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="h-4 w-4" /> Delete {purgePreview.count} Users</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
