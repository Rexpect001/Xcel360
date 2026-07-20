export const revalidate = 900
import type { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Newspaper, ArrowRight, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'News & Media',
  description:
    'Event recaps, announcements and highlights from Xcel360 — including our webinars, workshops and community programs.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'News & Media — Xcel360',
    description: 'Event recaps, announcements and highlights from Xcel360.',
    url: '/news',
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
      <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-sky-700 pt-28 pb-24 px-4 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
        <div className="max-w-3xl mx-auto relative text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-100 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 mb-5">
            <Newspaper className="h-3.5 w-3.5" /> News &amp; Media
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Stories from the Xcel360 community
          </h1>
          <p className="text-white/70 text-base md:text-lg">
            Recaps, announcements and highlights from our events, webinars and programs.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 -mt-10">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
            No stories published yet — check back soon.
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
