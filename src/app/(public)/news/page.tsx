export const revalidate = 900
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { ArrowRight, Calendar } from 'lucide-react'
import PageHero from '@/components/layout/PageHero'
import GoogleAd from '@/components/ads/GoogleAd'

export const metadata: Metadata = {
  title: 'News & Media',
  description:
    'Event recaps, announcements and highlights from Xcel360  -  including our webinars, workshops and community programs.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'News & Media  -  Xcel360',
    description: 'Event recaps, announcements and highlights from Xcel360.',
    url: '/news',
    images: [DEFAULT_OG_IMAGE],
  },
}

async function getPosts() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  return db.blogPost
    .findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } })
    .catch(() => [])
}

export default async function NewsPage() {
  const posts = await getPosts()
  const [lead, ...rest] = posts

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <PageHero
        eyebrow="News & Media"
        title="Stories from the Xcel360 community"
        subtitle="Recaps, announcements and highlights from our events, webinars and programs."
        className="pb-24"
      />

      <div className="max-w-5xl mx-auto px-4 py-12 -mt-10">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
            No stories published yet  -  check back soon.
          </div>
        ) : (
          <>
            {/* Lead story */}
            <Link
              href={`/news/${lead.slug}`}
              className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {lead.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead.coverImage} alt={lead.title} className="w-full h-64 sm:h-80 object-cover" />
              )}
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {(lead.tags ?? []).slice(0, 3).map((t: string) => (
                    <span key={t} className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(lead.createdAt)}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug group-hover:text-brand-700 transition-colors">
                  {lead.title}
                </h2>
                {lead.excerpt && <p className="text-gray-600 mt-3 leading-relaxed">{lead.excerpt}</p>}
                <span className="inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm mt-5">
                  Read the full story <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            <GoogleAd placement="listing-top" shape="leaderboard" className="mt-6" />

            {/* Rest */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-5 mt-6">
                {rest.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/news/${p.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    {p.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImage} alt={p.title} className="w-full h-44 object-cover" />
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(p.createdAt)}
                      </span>
                      <h3 className="font-bold text-gray-900 leading-snug group-hover:text-brand-700 transition-colors">
                        {p.title}
                      </h3>
                      {p.excerpt && <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">{p.excerpt}</p>}
                      <span className="inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm mt-4">
                        Read more <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
