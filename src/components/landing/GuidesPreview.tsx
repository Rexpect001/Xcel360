import Link from 'next/link'
import { BookOpen, ArrowRight, Clock } from 'lucide-react'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  tags: string[]
  createdAt: Date
}

function readMinutes(text: string | null): number {
  if (!text) return 3
  return Math.max(2, Math.round(text.split(/\s+/).length / 200))
}

/** Scholarships360-style "Expert Guides" preview - latest published blog posts. */
export default function GuidesPreview({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null

  return (
    <section className="py-16 sm:py-20 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
              Expert guides
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Learn how to win
            </h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Practical guides on applications, essays, and funding strategy.
            </p>
          </div>
          <Link
            href="/news"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors whitespace-nowrap"
          >
            All guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col hover:shadow-premium hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-brand-700" />
                </div>
                {post.tags[0] && (
                  <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                    {post.tags[0]}
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-brand-700 transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
              )}
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="h-3 w-3" /> {readMinutes(post.excerpt)} min read
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
