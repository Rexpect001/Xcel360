import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Bookmark, Calendar, MapPin, ExternalLink, ArrowRight } from 'lucide-react'
import { formatDate, daysUntilDeadline, getFundingBadgeColor } from '@/lib/utils'

export default async function SavedPage() {
  const session = await getAuth()
  if (!session) redirect('/signin')

  const saved = await prisma.savedOpportunity.findMany({
    where: { userId: session.user.id },
    include: { opportunity: true },
    orderBy: { savedAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Opportunities</h1>
        <p className="text-gray-500 mt-1">{saved.length} saved scholarship{saved.length !== 1 ? 's' : ''}</p>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Bookmark className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No saved opportunities yet</h2>
          <p className="text-gray-500 text-sm mb-6">Browse scholarships and save the ones you&apos;re interested in.</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors">
            Browse Opportunities <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {saved.map(({ opportunity: opp, savedAt }) => {
            const days = daysUntilDeadline(opp.deadline)
            return (
              <div key={opp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getFundingBadgeColor(opp.fundingType)}`}>{opp.fundingType}</span>
                    <span className={`text-xs font-medium ${days <= 30 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {days > 0 ? `${days}d left` : 'Closed'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{opp.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{opp.hostOrg}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.country}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(opp.deadline)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/opportunities/${opp.id}`} className="flex-1 text-center py-2 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors">
                      View details
                    </Link>
                    <a href={opp.applicationLink} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
