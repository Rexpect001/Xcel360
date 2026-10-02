import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Lightbulb } from 'lucide-react'
import PageHero from '@/components/layout/PageHero'
import SearchDemo from '@/components/landing/SearchDemo'

export const metadata: Metadata = {
  title: 'How to Search for Scholarships',
  description:
    'A 60-second walkthrough of finding scholarships on Xcel360: search in plain words, filter by level and funding, compare listings, and save them for deadline reminders.',
  alternates: { canonical: '/how-to-search' },
}

const TIPS = [
  { q: 'Search like you talk', a: 'Type "fully funded masters in Canada" or "PhD agriculture". Every word is matched against titles, hosts, fields and eligibility, so you do not need exact names.' },
  { q: 'Start broad, then filter', a: 'Run a short search first, then add one filter at a time. Level and funding type remove the most noise.' },
  { q: 'Read the deadline first', a: 'Red means under 7 days, amber under 30. If you cannot finish documents in time, save it for next cycle instead.' },
  { q: 'Check "Who can apply"', a: 'Each card shows the first eligibility rule. Open the details page for the full list before you start writing.' },
  { q: 'Save, do not bookmark', a: 'Saving adds the scholarship to your dashboard and sets reminders at 30, 14, 7 and 2 days before it closes.' },
  { q: 'Complete your profile', a: 'Your level, field and target countries power the match score, so the best fits rise to the top of your dashboard.' },
]

export default function HowToSearchPage() {
  return (
    <div className="bg-surface-50 min-h-screen">
      <PageHero
        eyebrow="Walkthrough"
        title="How to search for scholarships"
        subtitle="Four steps, about a minute. Watch it once and you will find better-fitting scholarships faster."
      />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <SearchDemo />
      </section>

      <section className="bg-white border-y border-surface-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <p className="eyebrow mb-2">Search smarter</p>
          <h2 className="font-display text-3xl text-ink-900 mb-8">Six habits of successful applicants</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TIPS.map((t) => (
              <div key={t.q} className="rounded-2xl border border-surface-200 p-5">
                <Lightbulb className="h-5 w-5 text-accent-600 mb-3" />
                <h3 className="font-bold text-ink-900">{t.q}</h3>
                <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">{t.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
        <h2 className="font-display text-3xl text-ink-900">Ready to try it?</h2>
        <p className="text-ink-500 mt-2">New opportunities added every day, each checked for a live deadline.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/opportunities" className="btn-primary">Search scholarships <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/signup" className="btn-gold">Create a free account</Link>
        </div>
      </section>
    </div>
  )
}
