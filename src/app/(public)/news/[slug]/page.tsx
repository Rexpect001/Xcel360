export const revalidate = 900
export async function generateStaticParams() { return [] }
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Calendar, User } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

async function getPost(slug: string) {
  return db.blogPost.findFirst({ where: { slug, published: true } }).catch(() => null)
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Story not found' }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: `/news/${post.slug}`,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: 'article',
    },
  }
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  // Content is authored as plain text; split blank lines into paragraphs.
  const paragraphs = String(post.content ?? '')
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-hero-gradient pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto relative">
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            {(post.tags ?? []).map((t: string) => (
              <span key={t} className="text-xs font-semibold text-brand-100 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                {t}
              </span>
            ))}
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {formatDate(post.createdAt)}
            </span>
            {post.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" /> {post.author}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-12 -mt-10">
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {post.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt={post.title} className="w-full h-64 sm:h-96 object-cover" />
          )}
          <div className="p-6 sm:p-10">
            {post.excerpt && (
              <p className="text-lg text-gray-700 leading-relaxed font-medium border-l-4 border-brand-600 pl-4 mb-8">
                {post.excerpt}
              </p>
            )}
            <div className="space-y-5">
              {paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-gray-700 leading-[1.8] whitespace-pre-wrap">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </article>

        <div className="text-center mt-8">
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
            <ArrowLeft className="h-4 w-4" /> Back to all stories
          </Link>
        </div>
      </div>
    </div>
  )
}
