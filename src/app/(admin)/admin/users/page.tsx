'use client'
import { useState, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { ROLE_LABELS, type UserRole } from '@/lib/permissions'

const ALL_ROLES: UserRole[] = ['USER', 'EDITOR', 'MODERATOR', 'MENTOR', 'MANAGER', 'ADMIN']

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

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
      toast.success(`Role updated to ${label}`)
    } else {
      toast.error('Failed to update role')
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{users.length} registered users</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Activity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const roleKey = (user.role ?? 'USER') as UserRole
                  const roleMeta = ROLE_LABELS[roleKey] ?? ROLE_LABELS['USER']
                  const isUpdating = updatingId === user.id

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* User info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name ?? '—'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Activity counts */}
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {user._count?.savedOpps ?? 0} saved · {user._count?.applications ?? 0} apps
                      </td>

                      {/* Joined date */}
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Role dropdown */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <div className="relative">
                            <select
                              value={user.role ?? 'USER'}
                              disabled={isUpdating}
                              onChange={(e) => changeRole(user, e.target.value as UserRole)}
                              className="appearance-none text-xs pl-2.5 pr-7 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 transition-colors"
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r].label}
                                </option>
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

      {/* Role legend */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Role Definitions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_ROLES.map((r) => {
            const meta = ROLE_LABELS[r]
            return (
              <div key={r} className="flex items-start gap-2.5">
                <span className={`mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${meta.color}`}>
                  {meta.label}
                </span>
                <p className="text-xs text-gray-500 leading-relaxed">{meta.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
