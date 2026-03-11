import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Bookmark, FileText, Bell, ArrowRight, Sparkles, UserCircle, Search, Globe } from 'lucide-react'
import { daysUntilDeadline } from '@/lib/utils'
import type { Opportunity, Profile } from '@prisma/client'

async function getDashboardData(userId: string) {
  const [profile, savedCount, applicationCount, unreadNotifications, openOpportunities] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.savedOpportunity.count({ where: { userId } }),
    prisma.application.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.opportunity.findMany({
      where: { status: 'OPEN', deadline: { gt: new Date() } },
      orderBy: [{ featured: 'desc' }, { deadline: 'asc' }],
      take: 30,
    }),
  ])
  return { profile, savedCount, applicationCount, unreadNotifications, openOpportunities }
}

function computeMatchScore(opp: Opportunity, profile: Profile | null): number {
  if (!profile) return 0
  let score = 0
  if (profile.level && opp.programLevel.includes(profile.level)) score += 2
  if (profile.targetCountries.length > 0 && (
    profile.targetCountries.includes(opp.country) || opp.country === 'Global'
  )) score += 2
  if (profile.targetFields.length > 0 && profile.targetFields.some((f) =>
    opp.fieldTags.includes(f) || opp.field === f
  )) score += 1
  return score
}

export default async function DashboardPage() {
  const session = await getAuth()
  if (!session) redirect('/signin')

  const { profile, savedCount, applicationCount, unreadNotifications, openOpportunities } =
    await getDashboardData(session.user.id)

  const profileComplete = !!(profile && profile.level && profile.targetCountries.length > 0)

  const taggedOpps = openOpportunities
    .map((opp) => ({ ...opp, matchScore: computeMatchScore(opp, profile) }))
    .sort((a, b) => b.matchScore - a.matchScore || (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  const matchedCount = taggedOpps.filter((o) => o.matchScore > 0).length
  const displayOpps = taggedOpps.slice(0, 9)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {profileComplete
            ? 'Here are scholarships matched to your profile.'
            : 'Complete your profile to see scholarships tailored to you.'}
        </p>
      </div>

      {/* Profile completion banner */}
      {!profileComplete && (
        <div className="mb-6 bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Update your profile for optimised results</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Tell us your study level, target countries, and fields so we can highlight the right scholarships for you.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Update Profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Saved', value: savedCount, href: '/dashboard/saved', Icon: Bookmark, color: 'text-blue-600 bg-blue-50' },
          { label: 'Applications', value: applicationCount, href: '/dashboard/applications', Icon: FileText, color: 'text-purple-600 bg-purple-50' },
          { label: 'Notifications', value: unreadNotifications, href: '/dashboard/notifications', Icon: Bell, color: 'text-red-600 bg-red-50' },
          { label: 'All Scholarships', value: '→', href: '/opportunities', Icon: Search, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, href, Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 group-hover:text-brand-600 transition-colors">{label}</div>
          </Link>
        ))}
      </div>

      {/* Scholarships section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {matchedCount > 0 ? 'Scholarships For You' : 'Available Scholarships'}
            </h2>
            {matchedCount > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-medium">
                {matchedCount} match{matchedCount !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <Link
            href="/opportunities"
            className="text-sm text-brand-600 font-medium flex items-center gap-1 hover:text-brand-800 transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {displayOpps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Globe className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No open scholarships right now</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon — new opportunities are added regularly.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayOpps.map((opp) => {
              const days = daysUntilDeadline(opp.deadline)
              const urgencyColor = days <= 7
                ? 'text-red-600 bg-red-50'
                : days <= 30
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-green-600 bg-green-50'

              return (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
                >
                  <div className="h-1 bg-gradient-to-r from-brand-600 to-brand-400" />
                  <div className="p-5">
                    {opp.matchScore > 0 && (
                      <div className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full font-medium mb-2.5">
                        <Sparkles className="h-3 w-3" />
                        Match for you
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-700 transition-colors line-clamp-2 mb-1 leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 truncate">
                      {opp.hostOrg} · {opp.country}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                        {opp.fundingType}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${urgencyColor}`}>
                        {days > 0 ? `${days}d left` : 'Closing soon'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
