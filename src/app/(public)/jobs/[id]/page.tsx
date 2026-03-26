export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { formatDate, daysUntilDeadline } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import ShareButtons from '@/components/ui/ShareButtons'
import { Calendar, MapPin, BookOpen, FileText, CheckCircle, Briefcase, DollarSign, Wifi, Star } from 'lucide-react'
import Link from 'next/link'
import ApplyButton from '@/components/ui/ApplyButton'
import SaveButton from '@/components/ui/SaveButton'
import { getAuth } from '@/lib/auth'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!job) return { title: 'Job Not Found' }
  const description = job.description?.slice(0, 155).trim() ?? `${job.jobType ?? 'Job'} at ${job.company ?? job.hostOrg} in ${job.country}.`
  return {
    title: job.title,
    description,
    keywords: [job.title, job.company ?? job.hostOrg, job.country, job.field, ...job.skills, 'jobs Africa'].filter(Boolean),
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: { title: job.title, description, url: `${BASE}/jobs/${job.id}`, type: 'article' },
  }
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, session] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null),
    getAuth(),
  ])
  if (!job || job.category === 'SCHOLARSHIP') notFound()

  const days = daysUntilDeadline(job.deadline)
  const pageUrl = `${BASE}/jobs/${job.id}`

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
              <Briefcase className="h-3.5 w-3.5 mr-1.5" />{job.jobType ?? 'Job'}
            </span>
            {job.remote && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <Wifi className="h-3.5 w-3.5 mr-1.5" />Remote
              </span>
            )}
            {job.experienceLevel && <Badge variant="blue">{job.experienceLevel}</Badge>}
            <Badge variant="gray">{job.field}</Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-lg text-gray-600 mb-1">{job.company ?? job.hostOrg}</p>
          {job.salary && (
            <p className="text-emerald-600 font-semibold mb-4 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />{job.salary}
            </p>
          )}

          <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-600" />{job.country}{job.region ? `, ${job.region}` : ''}</span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-600" />
              Apply by: <strong>{formatDate(job.deadline)}</strong>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${days <= 7 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {days > 0 ? `${days} days left` : 'Closed'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <ApplyButton href={job.applicationLink} title={job.title} />
            <SaveButton opportunityId={job.id} />
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <ShareButtons title={job.title} url={pageUrl} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {job.description && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-brand-600" /> About this role
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </section>
            )}

            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Requirements</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{job.eligibility}</p>
            </section>

            {job.skills.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-brand-600" /> Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium">{s}</span>
                  ))}
                </div>
              </section>
            )}

            {job.requiredDocs.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-600" /> Required Documents
                </h2>
                <ul className="space-y-2">
                  {job.requiredDocs.map((doc) => (
                    <li key={doc} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />{doc}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
              <h3 className="font-semibold text-emerald-900 mb-3">Quick Summary</h3>
              <dl className="space-y-2.5 text-sm">
                <div><dt className="text-gray-500 text-xs">Company</dt><dd className="font-medium text-gray-900">{job.company ?? job.hostOrg}</dd></div>
                <div><dt className="text-gray-500 text-xs">Country</dt><dd className="font-medium text-gray-900">{job.country}</dd></div>
                <div><dt className="text-gray-500 text-xs">Job Type</dt><dd className="font-medium text-gray-900">{job.jobType ?? '—'}</dd></div>
                {job.salary && <div><dt className="text-gray-500 text-xs">Salary</dt><dd className="font-medium text-emerald-700">{job.salary}</dd></div>}
                <div><dt className="text-gray-500 text-xs">Apply by</dt><dd className="font-medium text-gray-900">{formatDate(job.deadline)}</dd></div>
                <div><dt className="text-gray-500 text-xs">Experience</dt><dd className="font-medium text-gray-900">{job.experienceLevel ?? '—'}</dd></div>
              </dl>
            </div>

            {!session && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Track this job</h3>
                <p className="text-sm text-gray-500 mb-4">Save it to your dashboard and get deadline reminders.</p>
                <Link href="/signup" className="block w-full text-center bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors">
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
