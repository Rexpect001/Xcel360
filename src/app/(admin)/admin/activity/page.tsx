export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Activity, LogIn, LogOut, AlertTriangle, ShieldCheck } from 'lucide-react'

const ACTION_BADGE: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  SIGNUP: 'bg-teal-100 text-teal-700',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PUBLISH: 'bg-green-100 text-green-700',
  UNPUBLISH: 'bg-orange-100 text-orange-700',
  ASSIGN_ROLE: 'bg-purple-100 text-purple-700',
  SAVE_OPPORTUNITY: 'bg-indigo-100 text-indigo-700',
  APPLY: 'bg-cyan-100 text-cyan-700',
  VIEW: 'bg-gray-100 text-gray-500',
  DOWNLOAD: 'bg-violet-100 text-violet-700',
  CONTACT_FORM: 'bg-pink-100 text-pink-700',
  MENTOR_APPLICATION: 'bg-amber-100 text-amber-700',
}

export default async function ActivityLogPage() {
  const session = await getAuth()
  if (!session) redirect('/signin')
  const role = session.user.role
  if (role !== 'ADMIN') redirect('/admin')

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Stats for today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayLogs = logs.filter((l) => new Date(l.createdAt) >= todayStart)
  const totalToday = todayLogCount(todayLogs)
  const loginsToday = todayLogs.filter((l) => l.action === 'LOGIN').length
  const failedLoginsToday = todayLogs.filter((l) => l.action === 'LOGIN_FAILED').length
  const contentChangesToday = todayLogs.filter((l) =>
    ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH'].includes(l.action)
  ).length

  function todayLogCount(arr: typeof logs) {
    return arr.length
  }

  const stats = [
    {
      label: 'Events Today',
      value: totalToday,
      icon: Activity,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Logins Today',
      value: loginsToday,
      icon: LogIn,
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Failed Logins',
      value: failedLoginsToday,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-700',
    },
    {
      label: 'Content Changes',
      value: contentChangesToday,
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-700',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-500 mt-1">Last 200 platform events  -  all admin and user actions.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-white">Activity Feed</span>
          </div>
          <span className="text-xs text-gray-400">{logs.length} events shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Resource</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Details</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                    No activity logged yet. Events will appear here as users interact with the platform.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-xs truncate max-w-[140px]">
                        {log.userEmail ?? <span className="text-gray-400 italic">anonymous</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {log.userRole ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {log.userRole}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300"> - </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ACTION_BADGE[log.action] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                      {log.resource ? (
                        <span>
                          <span className="font-medium text-gray-700">{log.resource}</span>
                          {log.resourceName && (
                            <span className="text-gray-400"> · {log.resourceName}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-300"> - </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500 max-w-[200px] truncate">
                      {log.details ?? <span className="text-gray-300"> - </span>}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-400 font-mono">
                      {log.ipAddress ?? ' - '}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
