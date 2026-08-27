import Link from 'next/link'
import { Quote, ArrowRight, GraduationCap } from 'lucide-react'

type Story = {
  id: string
  name: string
  scholarship: string
  university: string
  quote: string
  year: number | null
}

/** Success stories from the CMS (SuccessStory model) — Scholarships360-style wall. */
export default function SuccessStories({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
              Success stories
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              They found their funding
            </h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Real students who won life-changing scholarships through Xcel360.
            </p>
          </div>
          <Link
            href="/success-stories"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors whitespace-nowrap"
          >
            All stories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.slice(0, 6).map((story) => (
            <figure
              key={story.id}
              className="bg-surface-50 rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-premium transition-shadow"
            >
              <Quote className="h-6 w-6 text-brand-200 mb-3" />
              <blockquote className="text-sm text-gray-700 leading-relaxed flex-1">
                “{story.quote}”
              </blockquote>
              <figcaption className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {story.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{story.name}</div>
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 shrink-0" />
                    {story.scholarship}{story.university ? ` · ${story.university}` : ''}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
