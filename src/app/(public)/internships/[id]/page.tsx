export const revalidate = 3600
export async function generateStaticParams() { return [] }
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
import GuestPrompt from '@/components/opportunities/GuestPrompt'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!job) return { title: 'Internship Not Found' }
  const imageUrl = job.imageUrl?.includes('/api/og') ? null : job.imageUrl
  const description = job.description?.slice(0, 155).trim() ?? `Internship at ${job.company ?? job.hostOrg} in ${job.country}.`
  return {
    title: job.title,
    description,
    keywords: [job.title, job.company ?? job.hostOrg, job.country, job.field, ...job.skills, 'internships Africa'].filter(Boolean),
    alternates: { canonical: `/internships/${job.id}` },
    openGraph: {
      title: job.title, description, url: `${BASE}/internships/${job.id}`, type: 'article',
      // Use the stored static card if one exists; skip the auto-generated OG
      // renderer otherwise rather than hitting it on every social unfurl.
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: job.title }] } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: job.title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

export default async function InternshipDetailPage({ params }: { params: { id: string } }) {
  const job = await prisma.opportunity.findUnique({ where: { id: params.id } }).catch(() => null)
  if (!job || job.category !== 'INTERNSHIP') notFound()

  const days = daysUntilDeadline(job.deadline)
  const pageUrl = `${BASE}/internships/${job.id}`

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
              <Briefcase className="h-3.5 w-3.5 mr-1.5" />Internship
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
            <p className="text-purple-600 font-semibold mb-4 flex items-center gap-1">
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
                  <BookOpen className="h-5 w-5 text-brand-600" /> About this internship
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
                  <Star className="h-5 w-5 text-brand-600" /> Skills Required
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{s}</span>
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
            <div className="bg-purple-50 rounded-2xl border border-purple-100 p-5">
              <h3 className="font-semibold text-purple-900 mb-3">Quick Summary</h3>
              <dl className="space-y-2.5 text-sm">
                <div><dt className="text-gray-500 text-xs">Organisation</dt><dd className="font-medium text-gray-900">{job.company ?? job.hostOrg}</dd></div>
                <div><dt className="text-gray-500 text-xs">Country</dt><dd className="font-medium text-gray-900">{job.country}</dd></div>
                {job.salary && <div><dt className="text-gray-500 text-xs">Stipend / Pay</dt><dd className="font-medium text-purple-700">{job.salary}</dd></div>}
                <div><dt className="text-gray-500 text-xs">Apply by</dt><dd className="font-medium text-gray-900">{formatDate(job.deadline)}</dd></div>
                <div><dt className="text-gray-500 text-xs">Level</dt><dd className="font-medium text-gray-900">{job.experienceLevel ?? ' - '}</dd></div>
              </dl>
            </div>

            <GuestPrompt kind="internship" />
          </div>
        </div>
      </div>
    </div>
  )
}
