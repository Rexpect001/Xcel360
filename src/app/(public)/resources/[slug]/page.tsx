// ISR: rendered on first visit, then served from cache for up to 5 minutes (see src/lib/isr.ts)
export const revalidate = 300
// Nothing is prerendered at build (no database there); each page is rendered
// on its first visit and then cached like the listing pages.
export function generateStaticParams() {
  return []
}
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import { Fragment, cache } from 'react'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'

// One query shared by generateMetadata and the page. A database error is thrown
// (not turned into a 404) so the error page is never written to the ISR cache.
const getPost = cache((slug: string) => prisma.blogPost.findUnique({ where: { slug } }))
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, BookOpen, Calendar, Tag, Clock } from 'lucide-react'
import GoogleAd from '@/components/ads/GoogleAd'
import { isArticleAdBreak } from '@/lib/ads'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbLd, metaDescription } from '@/lib/seo/structured-data'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug).catch(() => null)
  if (!post || !post.published) return { title: 'Article Not Found' }

  const description = metaDescription(post.excerpt || post.content)
  return {
    title: post.title,
    description,
    keywords: [...post.tags, 'scholarship guide', 'study abroad tips', 'Xcel360'],
    alternates: { canonical: `/resources/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url: `${BASE}/resources/${post.slug}`,
      type: 'article',
      images: post.coverImage ? [{ url: post.coverImage }] : [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: post.title, description, images: [post.coverImage ?? DEFAULT_OG_IMAGE.url] },
  }
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post || !post.published) notFound()

  const readTime = estimateReadTime(post.content)
  const paragraphs = post.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: `${BASE}/resources/${post.slug}`,
    image: post.coverImage || `${BASE}${DEFAULT_OG_IMAGE.url}`,
    publisher: { '@type': 'Organization', name: 'Xcel360', logo: { '@type': 'ImageObject', url: `${BASE}/icon.png` } },
    mainEntityOfPage: `${BASE}/resources/${post.slug}`,
    keywords: post.tags.join(', '),
  }

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumbLd([{ name: 'Resources', path: '/resources' }, { name: post.title, path: `/resources/${post.slug}` }])]} />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero */}
        <div className="bg-hero-gradient py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-brand-100 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Resources
            </Link>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white/10 text-brand-100 rounded-full"
                  >
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{post.title}</h1>

            {post.excerpt && (
              <p className="text-brand-100 text-lg leading-relaxed mb-6">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-5 text-sm text-brand-100">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />{post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />{formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />{readTime}
              </span>
            </div>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="max-w-3xl mx-auto px-4 -mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full rounded-2xl shadow-lg object-cover max-h-80"
            />
          </div>
        )}

        {/* Article body */}
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="prose prose-brand max-w-none text-gray-700 text-base leading-relaxed space-y-5">
              {paragraphs.map((p, i) => (
                <Fragment key={i}>
                  <p className="whitespace-pre-wrap">{p}</p>
                  {isArticleAdBreak(i, paragraphs.length) && <GoogleAd placement="detail-inline" className="not-prose" />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Footer nav */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-brand-700 font-medium hover:text-brand-800 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> All Resources
            </Link>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Browse Scholarships
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
