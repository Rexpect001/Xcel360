import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Users, BookOpen, Bookmark, FileText, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminAnalyticsPage() {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const [totalUsers, totalOpps, totalSaved, totalApps, openOpps, popularOpps, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.opportunity.count(),
      prisma.savedOpportunity.count(),
      prisma.application.count(),
      prisma.opportunity.count({ where: { status: 'OPEN' } }),
      prisma.opportunity.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        include: { _count: { select: { savedBy: true } } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Platform performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users },
          { label: 'Open Opportunities', value: openOpps, icon: BookOpen },
          { label: 'Total Saves', value: totalSaved, icon: Bookmark },
          { label: 'Applications Tracked', value: totalApps, icon: FileText },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <Icon className="h-5 w-5 text-brand-600 mb-2" />
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular opportunities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Most Viewed Opportunities</h2>
          {popularOpps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {popularOpps.map((opp, i) => (
                <div key={opp.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{opp.title}</div>
                    <div className="text-xs text-gray-500">{opp._count.savedBy} saves</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                    <Eye className="h-3.5 w-3.5" />
                    {opp.views}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Recent Users</h2>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {user.name ?? 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
