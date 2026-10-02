import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SearchDemo from '@/components/landing/SearchDemo'

/** Homepage section wrapping the animated search walkthrough. */
export default function HowToSearch() {
  return (
    <section className="py-16 sm:py-24 bg-surface-100/70 border-y border-surface-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-2">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Find your scholarship in four steps</h2>
          <p className="text-ink-500 mt-3">
            Watch how to go from a few words to a shortlist with deadline reminders.{' '}
            <Link href="/how-to-search" className="font-semibold text-brand-700 hover:underline inline-flex items-center gap-1">
              Full walkthrough <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
        <SearchDemo />
      </div>
    </section>
  )
}
