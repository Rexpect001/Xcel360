import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { formatDate, daysUntilDeadline, getFundingBadgeColor } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import ShareButtons from '@/components/ui/ShareButtons'
import { Calendar, MapPin, ExternalLink, BookOpen, FileText, CheckCircle, Bookmark } from 'lucide-react'
import Link from 'next/link'

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opp = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!opp) notFound()

  const days = daysUntilDeadline(opp.deadline)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'
  const pageUrl = `${appUrl}/opportunities/${opp.id}`

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getFundingBadgeColor(opp.fundingType)}`}>
              {opp.fundingType}
            </span>
            {opp.programLevel.map((l) => <Badge key={l} variant="blue">{l}</Badge>)}
            <Badge variant="gray">{opp.field}</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{opp.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{opp.hostOrg}</p>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              {opp.country}{opp.region ? `, ${opp.region}` : ''}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-600" />
              Deadline: <strong>{formatDate(opp.deadline)}</strong>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${days <= 7 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {days > 0 ? `${days} days left` : 'Closed'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 items-center">
            <a
              href={opp.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-800 transition-colors"
            >
              Apply Now <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 border-2 border-brand-700 text-brand-700 px-6 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
            >
              <Bookmark className="h-4 w-4" /> Save
            </Link>
          </div>

          {/* Share buttons */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <ShareButtons title={opp.title} url={pageUrl} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main */}
          <div className="md:col-span-2 space-y-8">
            {opp.description && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-brand-600" /> About this scholarship
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{opp.description}</p>
              </section>
            )}

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Eligibility</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{opp.eligibility}</p>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" /> Required Documents
              </h2>
              <ul className="space-y-2">
                {opp.requiredDocs.map((doc) => (
                  <li key={doc} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {doc}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
              <h3 className="font-semibold text-brand-900 mb-3">Quick Summary</h3>
              <dl className="space-y-2.5 text-sm">
                <div><dt className="text-gray-500 text-xs">Host</dt><dd className="font-medium text-gray-900">{opp.hostOrg}</dd></div>
                <div><dt className="text-gray-500 text-xs">Country</dt><dd className="font-medium text-gray-900">{opp.country}</dd></div>
                <div><dt className="text-gray-500 text-xs">Funding</dt><dd className="font-medium text-gray-900">{opp.fundingType}</dd></div>
                <div><dt className="text-gray-500 text-xs">Deadline</dt><dd className="font-medium text-gray-900">{formatDate(opp.deadline)}</dd></div>
                <div><dt className="text-gray-500 text-xs">Levels</dt><dd className="font-medium text-gray-900">{opp.programLevel.join(', ')}</dd></div>
              </dl>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Track this scholarship</h3>
              <p className="text-sm text-gray-500 mb-4">Save it to your dashboard and get deadline reminders automatically.</p>
              <Link href="/signup" className="block w-full text-center bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
