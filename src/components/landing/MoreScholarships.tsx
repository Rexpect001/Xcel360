import { Fragment } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import OpportunityCard, { type CardOpportunity } from '@/components/opportunities/OpportunityCard'
import GoogleAd from '@/components/ads/GoogleAd'

/**
 * "More to explore" - nine scholarships in the shared snapshot format
 * (Level · Destination · Funding · Deadline + who can apply), so visitors can
 * compare quickly before opening the full details.
 */
export default function MoreScholarships({ scholarships }: { scholarships: CardOpportunity[] }) {
  if (scholarships.length === 0) return null
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Worth your time</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink-900">More scholarships to explore</h2>
            <p className="text-ink-500 mt-2 text-sm sm:text-base">
              Each card follows the same snapshot: level, destination, funding and deadline, plus who can apply.
            </p>
          </div>
          <Link href="/opportunities" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-ink-900 whitespace-nowrap">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {scholarships.map((s, i) => (
            <Fragment key={s.id}>
              <OpportunityCard opp={s} />
              {i === 5 && scholarships.length > 6 && (
                <GoogleAd placement="listing-infeed" className="sm:col-span-2 lg:col-span-3" />
              )}
            </Fragment>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/opportunities" className="btn-primary">
            Browse every scholarship <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
