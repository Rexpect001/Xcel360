'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  Search, ChevronDown, User, Mail, Phone, BookOpen, MapPin,
  KeyRound, X, Loader2, Shield, CheckCircle2, Trash2,
  UserCheck, UserX, AlertTriangle, Clock, Filter,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { ROLE_LABELS, type UserRole } from '@/lib/permissions'
import Modal from '@/components/ui/Modal'

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Detail modal
  const [detailUser, setDetailUser] = useState<any | null>(null)
  const [detailData, setDetailData] = useState<{ user: any; activityLog: any[] } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile')

  // Password reset
  const [pwModal, setPwModal] = useState<{ userId: string; userName: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  // Inactive purge
  const [purgePreview, setPurgePreview] = useState<{ count: number; cutoff: string } | null>(null)
  const [purging, setPurging] = useState(false)
  const [showPurgeModal, setShowPurgeModal] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    let list = users
    const q = search.toLowerCase()
    if (q) {
      list = list.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      )
    }
    if (filterRole) list = list.filter((u) => u.role === filterRole)
    if (filterStatus) list = list.filter((u) => (u.status ?? 'ACTIVE') === filterStatus)
    return list
  }, [users, search, filterRole, filterStatus])

  const hasFilters = search || filterRole || filterStatus

  const changeRole = async (user: any, newRole: UserRole) => {
    if (newRole === user.role) return
    const label = ROLE_LABELS[newRole]?.label ?? newRole
    if (!confirm(`Change ${user.name || user.email}'s role to ${label}?`)) return
    setUpdatingId(user.id)
    const res = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setUpdatingId(null)
    if (res.ok) {
      const updated = await res.json()
      setUsers((p) => p.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u)))
      if (detailData?.user?.id === updated.id) {
        setDetailData((d) => d ? { ...d, user: { ...d.user, role: updated.role } } : d)
      }
      toast.success(`Role updated to ${label}`)
    } else {
      toast.error('Failed to update role')
    }
  }

  const changeStatus = async (user: any, newStatus: string) => {
    if ((user.status ?? 'ACTIVE') === newStatus) return
    setUpdatingId(user.id)
    const res = await fetch(`/api/admin/users/${user.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setUpdatingId(null)
    if (res.ok) {
      setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)))
      if (detailData?.user?.id === user.id) {
        setDetailData((d) => d ? { ...d, user: { ...d.user, status: newStatus } } : d)
      }
      const label = STATUS_META[newStatus]?.label ?? newStatus
      toast.success(`User ${label.toLowerCase()}`)
    } else {
      toast.error('Failed to update status')
    }
  }

  const openDetail = async (user: any) => {
    setDetailUser(user)
    setDetailData(null)
    setDetailLoading(true)
    setActiveTab('profile')
    const res = await fetch(`/api/admin/users/${user.id}/detail`)
    if (res.ok) {
      const data = await res.json()
      setDetailData(data)
    }
    setDetailLoading(false)
  }

  const handleResetPassword = async () => {
    if (!pwModal) return
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setPwSaving(true)
    const res = await fetch(`/api/admin/users/${pwModal.userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    })
    if (res.ok) {
      toast.success(`Password reset for ${pwModal.userName}`)
      setPwModal(null)
      setNewPassword('')
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed to reset password')
    }
    setPwSaving(false)
  }

  const previewPurge = async () => {
    const res = await fetch('/api/admin/users/purge-inactive')
    if (res.ok) {
      const d = await res.json()
      setPurgePreview(d)
      setShowPurgeModal(true)
    }
  }

  const executePurge = async () => {
    setPurging(true)
    const res = await fetch('/api/admin/users/purge-inactive', { method: 'POST' })
    if (res.ok) {
      const d = await res.json()
      toast.success(`Removed ${d.deleted} inactive user${d.deleted !== 1 ? 's' : ''}`)
      setShowPurgeModal(false)
      // refresh list
      fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []))
    } else {
      toast.error('Purge failed')
    }
    setPurging(false)
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ACTIVE: 0, SUSPENDED: 0, DISABLED: 0 }
    users.forEach((u) => { counts[u.status ?? 'ACTIVE'] = (counts[u.status ?? 'ACTIVE'] ?? 0) + 1 })
    return counts
  }, [users])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="text-sm text-gray-500">{users.length} total</span>
            {Object.entries(statusCounts).map(([s, n]) => n > 0 && (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_META[s].color}`}>
                {n} {STATUS_META[s].label}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={previewPurge}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100"
        >
          <Trash2 className="h-4 w-4" /> Remove Inactive (2+ yrs)
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white appearance-none"
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus('') }}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 px-2"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''} shown</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Last Login</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">No users found</td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const roleKey = (user.role ?? 'USER') as UserRole
                  const roleMeta = ROLE_LABELS[roleKey] ?? ROLE_LABELS['USER']
                  const status = user.status ?? 'ACTIVE'
                  const statusMeta = STATUS_META[status]
                  const isUpdating = updatingId === user.id

                  return (
                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${status === 'DISABLED' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(user)} className="flex items-center gap-3 text-left group">
                          <div className="relative">
                            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                              {user.name?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? 'U'}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusMeta.dot}`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">
                              {user.name ?? '—'}
                            </div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {user.lastLoginAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(user.lastLoginAt)}
                          </span>
                        ) : (
                          <span className="text-gray-300">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Status quick actions */}
                          {status !== 'ACTIVE' && (
                            <button
                              onClick={() => changeStatus(user, 'ACTIVE')}
                              disabled={isUpdating}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                              title="Reactivate"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          {status !== 'SUSPENDED' && (
                            <button
                              onClick={() => changeStatus(user, 'SUSPENDED')}
                              disabled={isUpdating}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                              title="Suspend"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          )}
                          {status !== 'DISABLED' && (
                            <button
                              onClick={() => changeStatus(user, 'DISABLED')}
                              disabled={isUpdating}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Disable"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setPwModal({ userId: user.id, userName: user.name || user.email })}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            title="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <div className="relative">
                            <select
                              value={user.role ?? 'USER'}
                              disabled={isUpdating}
                              onChange={(e) => changeRole(user, e.target.value as UserRole)}
                              className="appearance-none text-xs pl-2.5 pr-7 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-50 hover:border-gray-300 transition-colors"
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {detailUser && (
        <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title="User Profile" size="lg">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl flex-shrink-0">
                {detailUser.name?.charAt(0)?.toUpperCase() ?? detailUser.email?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{detailUser.name ?? 'No name'}</h2>
                <p className="text-sm text-gray-500">{detailUser.email}</p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  {(() => {
                    const roleKey = (detailData?.user?.role ?? detailUser.role ?? 'USER') as UserRole
                    const roleMeta = ROLE_LABELS[roleKey] ?? ROLE_LABELS['USER']
                    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMeta.color}`}>{roleMeta.label}</span>
                  })()}
                  {(() => {
                    const s = detailData?.user?.status ?? detailUser.status ?? 'ACTIVE'
                    const sm = STATUS_META[s]
                    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sm.color}`}>{sm.label}</span>
                  })()}
                  {detailData?.user?.emailVerified && (
                    <span className="text-xs text-green-600 flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setDetailUser(null); setPwModal({ userId: detailUser.id, userName: detailUser.name || detailUser.email }) }}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-semibold hover:bg-orange-100 transition-colors flex-shrink-0"
              >
                <KeyRound className="h-3.5 w-3.5" /> Reset PW
              </button>
            </div>

            {/* Status action buttons */}
            {detailData && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 w-full mb-1 font-medium">Account Status</p>
                {(['ACTIVE', 'SUSPENDED', 'DISABLED'] as const).map((s) => {
                  const sm = STATUS_META[s]
                  const isCurrent = (detailData.user.status ?? 'ACTIVE') === s
                  return (
                    <button
                      key={s}
                      onClick={() => changeStatus(detailData.user, s)}
                      disabled={isCurrent || updatingId === detailData.user.id}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-60 ${
                        isCurrent ? `${sm.color} border-current` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {s === 'ACTIVE' && <UserCheck className="h-3 w-3" />}
                      {s === 'SUSPENDED' && <AlertTriangle className="h-3 w-3" />}
                      {s === 'DISABLED' && <UserX className="h-3 w-3" />}
                      {sm.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">{detailUser._count?.savedOpps ?? 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">Saved</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-gray-800">{detailUser._count?.applications ?? 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">Applications</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs font-medium text-gray-600 mt-1">{formatDate(detailUser.createdAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Joined</p>
              </div>
            </div>

            {/* Last login */}
            {detailData?.user?.lastLoginAt && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last login: {formatDate(detailData.user.lastLoginAt)}
              </p>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(['profile', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'profile' ? 'Profile Info' : 'Activity Log'}
                </button>
              ))}
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-7 w-7 text-brand-700 animate-spin" />
              </div>
            ) : (
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
                    ].map(({ icon: Icon, label, value }) =>
                      value ? (
                        <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                          <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">{label}</p>
                            <p className="text-sm text-gray-800 font-medium">{value}</p>
                          </div>
                        </div>
                      ) : null
                    )}
                    {detailData.user.profile?.bio && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">Bio</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{detailData.user.profile.bio}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <p className="text-xs text-gray-400 mb-2">Change Role</p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_ROLES.map((r) => {
                          const meta = ROLE_LABELS[r]
                          const isCurrent = (detailData.user.role ?? 'USER') === r
                          return (
                            <button
                              key={r}
                              onClick={() => changeRole(detailData.user, r)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                                isCurrent ? `${meta.color} border-current` : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {meta.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && detailData && (
                  <div>
                    {detailData.activityLog.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">No activity logged yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {detailData.activityLog.map((log: any) => {
                          const colorCls = ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'
                          return (
                            <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${colorCls}`}>
                                {log.action}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700">
                                  {log.resource && <span className="text-gray-400">{log.resource}: </span>}
                                  <span className="font-medium">{log.resourceName ?? log.details ?? '—'}</span>
                                </p>
                              </div>
                              <p className="text-xs text-gray-400 shrink-0">
                                {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
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
            <p className="text-sm text-gray-500">
              Set a new password for <span className="font-semibold text-gray-800">{pwModal.userName}</span>.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-red-500 mt-1">Must be at least 8 characters</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPwModal(null); setNewPassword('') }}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={pwSaving || newPassword.length < 8}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {pwSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><KeyRound className="h-4 w-4" /> Reset Password</>}
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
                    {purgePreview.count === 0
                      ? 'No inactive users found. Everyone has been active within the last 2 years.'
                      : `${purgePreview.count} user${purgePreview.count !== 1 ? 's' : ''} will be permanently deleted.`}
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    Criteria: role = USER, no login since {new Date(purgePreview.cutoff).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurgeModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executePurge}
                disabled={purging || purgePreview.count === 0}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purging ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : <><Trash2 className="h-4 w-4" /> Delete {purgePreview.count} Users</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
