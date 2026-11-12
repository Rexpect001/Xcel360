export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import prisma from '@/lib/prisma'
import GoogleAd from '@/components/ads/GoogleAd'
import DownloadCountdown from '@/components/resources/DownloadCountdown'

export const metadata: Metadata = {
  title: 'Preparing your download',
  robots: { index: false, follow: true },
}

/**
 * Short stop between the Download button and the file: shows an ad while a
 * countdown runs, then starts the download. The ad sits well apart from the
 * button so it is never clicked by mistake.
 */
export default async function ResourceDownloadPage({ params }: { params: { id: string } }) {
  const resource = await (prisma as any).resource
    .findUnique({
      where: { id: params.id },
      select: { id: true, title: true, description: true, fileUrl: true, filename: true, isUploaded: true, published: true },
    })
    .catch(() => null)

  if (!resource || !resource.published || !resource.fileUrl) notFound()

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/resources" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Resources
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl text-ink-900 leading-snug">{resource.title}</h1>
              {resource.description && <p className="text-sm text-ink-500 mt-1 line-clamp-2">{resource.description}</p>}
            </div>
          </div>
          <DownloadCountdown
            resource={{
              id: resource.id,
              title: resource.title,
              // Uploaded files go through the proxy route, so keep their blob URL server-side.
              fileUrl: resource.isUploaded ? '' : resource.fileUrl,
              filename: resource.filename,
              isUploaded: resource.isUploaded,
            }}
          />
        </div>

        <GoogleAd placement="detail-top" shape="rectangle" className="mt-10" />

        <p className="mt-8 text-center text-sm text-ink-500">
          Ads keep Xcel360 resources free.{' '}
          <Link href="/resources" className="font-semibold text-brand-700 hover:underline">Browse more templates</Link>
        </p>
      </div>
    </div>
  )
}
